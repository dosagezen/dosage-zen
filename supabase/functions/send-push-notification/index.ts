import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface ScheduledNotification {
  id: string;
  profile_id: string;
  title: string;
  body: string;
  data: any;
  scheduled_for: string;
}

// Function to send Web Push notification
async function sendWebPush(
  subscription: PushSubscription,
  payload: any,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    const { endpoint, p256dh, auth } = subscription;
    
    // Web Push requires VAPID authentication
    const vapidHeaders = {
      'Content-Type': 'application/json',
      'TTL': '86400', // 24 hours
    };

    // For production, you would use a proper Web Push library
    // This is a simplified version - in production use web-push npm package via Deno
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: vapidHeaders,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Push send failed:', response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending web push:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date().toISOString();
    console.log('[Send Push] Starting notification check at:', now);

    // Fetch pending notifications that should be sent now
    const { data: notifications, error: fetchError } = await supabaseClient
      .from('notification_schedule')
      .select('*')
      .lte('scheduled_for', now)
      .is('sent_at', null)
      .eq('is_cancelled', false)
      .limit(50); // Process max 50 at a time

    if (fetchError) {
      console.error('[Send Push] Error fetching notifications:', fetchError);
      throw fetchError;
    }

    if (!notifications || notifications.length === 0) {
      console.log('[Send Push] No pending notifications to send');
      return new Response(
        JSON.stringify({ message: 'No pending notifications', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Send Push] Found ${notifications.length} notifications to send`);

    let sentCount = 0;
    let failedCount = 0;

    // Process each notification
    for (const notification of notifications as ScheduledNotification[]) {
      try {
        // Get active push subscriptions for this profile
        const { data: subscriptions, error: subError } = await supabaseClient
          .from('push_subscriptions')
          .select('*')
          .eq('profile_id', notification.profile_id)
          .eq('is_active', true);

        if (subError) {
          console.error('[Send Push] Error fetching subscriptions:', subError);
          failedCount++;
          continue;
        }

        if (!subscriptions || subscriptions.length === 0) {
          console.log(`[Send Push] No active subscriptions for profile ${notification.profile_id}`);
          // Mark as sent anyway (user has no active devices)
          await supabaseClient
            .from('notification_schedule')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', notification.id);
          continue;
        }

        console.log(`[Send Push] Sending to ${subscriptions.length} subscriptions for notification ${notification.id}`);

        // Send to all active subscriptions
        const sendPromises = subscriptions.map((sub) =>
          sendWebPush(
            {
              endpoint: sub.endpoint,
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
            {
              title: notification.title,
              body: notification.body,
              icon: '/favicon.png',
              badge: '/favicon.png',
              data: notification.data,
              tag: `${notification.id}`,
              requireInteraction: true,
              vibrate: [200, 100, 200],
            },
            vapidPublicKey,
            vapidPrivateKey
          )
        );

        const results = await Promise.allSettled(sendPromises);
        const successCount = results.filter((r) => r.status === 'fulfilled' && r.value).length;

        if (successCount > 0) {
          // Mark as sent
          await supabaseClient
            .from('notification_schedule')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', notification.id);

          sentCount++;
          console.log(`[Send Push] Successfully sent notification ${notification.id} to ${successCount} devices`);
        } else {
          failedCount++;
          console.error(`[Send Push] Failed to send notification ${notification.id} to any device`);
        }
      } catch (error) {
        console.error(`[Send Push] Error processing notification ${notification.id}:`, error);
        failedCount++;
      }
    }

    console.log(`[Send Push] Complete. Sent: ${sentCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({ 
        message: 'Notifications processed', 
        sent: sentCount, 
        failed: failedCount,
        total: notifications.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Send Push] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
