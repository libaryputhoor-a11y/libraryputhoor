-- Create invitations table to track pending invites
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  accepted_at timestamp with time zone,
  CONSTRAINT email_format CHECK (char_length(email) <= 255 AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage invitations
CREATE POLICY "Admins can view invitations" ON public.invitations
FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create invitations" ON public.invitations
FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete invitations" ON public.invitations
FOR DELETE USING (is_admin(auth.uid()));