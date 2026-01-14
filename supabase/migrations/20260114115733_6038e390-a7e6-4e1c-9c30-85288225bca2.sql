-- Drop existing policies on notification_queue
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notification_queue;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notification_queue;
DROP POLICY IF EXISTS "Admins and coaches can insert notifications" ON public.notification_queue;

-- Recreate policies with explicit authentication requirement
CREATE POLICY "Users can view their own notifications"
ON public.notification_queue
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications"
ON public.notification_queue
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins and coaches can insert notifications"
ON public.notification_queue
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coach'::app_role));