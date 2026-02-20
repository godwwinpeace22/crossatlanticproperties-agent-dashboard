-- 1. Update Profiles Role Constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('super_admin', 'admin', 'manager', 'agent', 'buyer', 'staff'));
COMMENT ON COLUMN public.profiles.role IS 'User role: super_admin (full access), admin (admin), manager (operations), agent (sales), buyer (customer), staff (support)';

-- 2. Profiles Policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
    )
  );

-- 3. Properties Policies
DROP POLICY IF EXISTS "Anyone can view available properties" ON public.properties;
CREATE POLICY "Anyone can view available properties"
  ON public.properties FOR SELECT
  USING (status = 'available' OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
  ));

DROP POLICY IF EXISTS "Only admins can manage properties" ON public.properties;
CREATE POLICY "Only admins can manage properties"
  ON public.properties FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
    )
  );

-- 4. Agent Hierarchy Policies
DROP POLICY IF EXISTS "Agents can view their own hierarchy" ON public.agent_hierarchy;
CREATE POLICY "Agents can view their own hierarchy"
  ON public.agent_hierarchy FOR SELECT
  USING (
    agent_id = auth.uid() OR 
    upline_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Only admins can manage hierarchy" ON public.agent_hierarchy;
CREATE POLICY "Only admins can manage hierarchy"
  ON public.agent_hierarchy FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Only admins can update hierarchy" ON public.agent_hierarchy;
CREATE POLICY "Only admins can update hierarchy"
  ON public.agent_hierarchy FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
    )
  );

-- 5. Payment Submissions Policies
DROP POLICY IF EXISTS "Agents can view their own submissions" ON public.payment_submissions;
CREATE POLICY "Agents can view their own submissions"
  ON public.payment_submissions FOR SELECT
  USING (
    submitter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Only admins can update submissions" ON public.payment_submissions;
CREATE POLICY "Only admins can update submissions"
  ON public.payment_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
    )
  );

-- 6. Purchases Policies
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.purchases;
CREATE POLICY "Users can view their own purchases"
  ON public.purchases FOR SELECT
  USING (
    buyer_id = auth.uid() OR 
    seller_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Only admins can manage purchases" ON public.purchases;
CREATE POLICY "Only admins can manage purchases"
  ON public.purchases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
    )
  );

-- 7. Commissions Policies
DROP POLICY IF EXISTS "Agents can view their own commissions" ON public.commissions;
CREATE POLICY "Agents can view their own commissions"
  ON public.commissions FOR SELECT
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Only admins can manage commissions" ON public.commissions;
CREATE POLICY "Only admins can manage commissions"
  ON public.commissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
    )
  );

-- 8. Commission Settings Policies
DROP POLICY IF EXISTS "Only admins can manage commission settings" ON public.commission_settings;
CREATE POLICY "Only admins can manage commission settings"
  ON public.commission_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
    )
  );

-- 9. Blog Post Policies
DROP POLICY IF EXISTS "Only admins can manage blog posts" ON public.blog_posts;
CREATE POLICY "Only admins can manage blog posts" ON public.blog_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'admin', 'manager')
    )
  );

-- 10. KYC Submissions Policies
DROP POLICY IF EXISTS "Users can view their own KYC submissions" ON public.kyc_submissions;
CREATE POLICY "Users can view their own KYC submissions"
  ON public.kyc_submissions FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
  ));

DROP POLICY IF EXISTS "Admins can manage all KYC submissions" ON public.kyc_submissions;
CREATE POLICY "Admins can manage all KYC submissions"
  ON public.kyc_submissions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
  ));

-- 11. Property Interests Policies
DROP POLICY IF EXISTS "Users can view their own property interests" ON public.property_interests;
CREATE POLICY "Users can view their own property interests"
  ON public.property_interests FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
  ));

DROP POLICY IF EXISTS "Admins can manage all property interests" ON public.property_interests;
CREATE POLICY "Admins can manage all property interests"
  ON public.property_interests FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
  ));

-- 12. Installment Payments Policies
DROP POLICY IF EXISTS "Users can view their own installment payments" ON public.installment_payments;
CREATE POLICY "Users can view their own installment payments"
  ON public.installment_payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.property_interests pi
    WHERE pi.id = property_interest_id AND pi.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
  ));

DROP POLICY IF EXISTS "Admins can manage all installment payments" ON public.installment_payments;
CREATE POLICY "Admins can manage all installment payments"
  ON public.installment_payments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
  ));

-- 13. Storage Policies (Blog Images)
DROP POLICY IF EXISTS "Only admins can upload blog images" ON storage.objects;
CREATE POLICY "Only admins can upload blog images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'blog-images' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'admin', 'manager')
    )
  );
