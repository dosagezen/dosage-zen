-- Create enum for notification types
CREATE TYPE notification_type AS ENUM ('medicacao', 'consulta', 'exame', 'atividade');

-- Create table for push subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Create table for notification schedule
CREATE TABLE public.notification_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  notification_type notification_type NOT NULL,
  entity_id UUID NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMPTZ,
  is_cancelled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for notification preferences
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  medicacao_enabled BOOLEAN DEFAULT true,
  consulta_enabled BOOLEAN DEFAULT true,
  exame_enabled BOOLEAN DEFAULT true,
  atividade_enabled BOOLEAN DEFAULT true,
  medicacao_advance_minutes INTEGER DEFAULT 5,
  consulta_advance_hours INTEGER DEFAULT 24,
  exame_advance_hours INTEGER DEFAULT 24,
  atividade_advance_hours INTEGER DEFAULT 1,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for notification_schedule
CREATE POLICY "Users can view their notification schedule"
  ON public.notification_schedule FOR SELECT
  USING (
    profile_id = get_user_profile_id(auth.uid()) OR
    profile_id IN (
      SELECT patient_profile_id FROM collaborations
      WHERE collaborator_profile_id = get_user_profile_id(auth.uid())
        AND is_active = true
    )
  );

CREATE POLICY "System can manage notification schedule"
  ON public.notification_schedule FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their preferences"
  ON public.notification_preferences FOR SELECT
  USING (
    profile_id = get_user_profile_id(auth.uid()) OR
    profile_id IN (
      SELECT patient_profile_id FROM collaborations
      WHERE collaborator_profile_id = get_user_profile_id(auth.uid())
        AND is_active = true
    )
  );

CREATE POLICY "Users can manage their preferences"
  ON public.notification_preferences FOR ALL
  USING (profile_id = get_user_profile_id(auth.uid()))
  WITH CHECK (profile_id = get_user_profile_id(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);
CREATE INDEX idx_notification_schedule_profile ON public.notification_schedule(profile_id);
CREATE INDEX idx_notification_schedule_scheduled ON public.notification_schedule(scheduled_for) WHERE sent_at IS NULL AND is_cancelled = false;
CREATE INDEX idx_notification_preferences_profile ON public.notification_preferences(profile_id);

-- Create trigger for updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_schedule_updated_at
  BEFORE UPDATE ON public.notification_schedule
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();