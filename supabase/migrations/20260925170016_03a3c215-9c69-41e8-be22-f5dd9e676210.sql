
CREATE TYPE public.app_role AS ENUM ('tourist','host','admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.host_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  bio text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.host_profiles TO authenticated;
GRANT SELECT ON public.host_profiles TO anon;
GRANT ALL ON public.host_profiles TO service_role;
ALTER TABLE public.host_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  host_name text NOT NULL DEFAULT 'Local Host',
  host_verified boolean NOT NULL DEFAULT false,
  name text NOT NULL,
  location text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_per_night integer NOT NULL DEFAULT 1000,
  amenities text[] NOT NULL DEFAULT '{}',
  photos text[] NOT NULL DEFAULT '{}',
  latitude double precision,
  longitude double precision,
  available_from date,
  available_to date,
  status text NOT NULL DEFAULT 'pending',
  location_verified boolean NOT NULL DEFAULT false,
  rating numeric(2,1) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT SELECT ON public.properties TO anon;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tourist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_name text NOT NULL DEFAULT '',
  check_in date NOT NULL,
  check_out date NOT NULL,
  nights integer NOT NULL DEFAULT 1,
  guests integer NOT NULL DEFAULT 1,
  total_price integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Guest',
  rating integer NOT NULL DEFAULT 5,
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  code text NOT NULL,
  amount integer NOT NULL DEFAULT 100,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.rewards TO authenticated;
GRANT ALL ON public.rewards TO service_role;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- policies
CREATE POLICY "profiles own read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles own insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles own update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "roles own read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "hosts public read" ON public.host_profiles FOR SELECT USING (true);
CREATE POLICY "hosts own insert" ON public.host_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "hosts own update" ON public.host_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (true);

CREATE POLICY "properties public read approved" ON public.properties FOR SELECT USING (status = 'approved');
CREATE POLICY "properties owner read" ON public.properties FOR SELECT TO authenticated USING (auth.uid() = host_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "properties owner insert" ON public.properties FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "properties owner update" ON public.properties FOR UPDATE TO authenticated USING (auth.uid() = host_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (true);
CREATE POLICY "properties owner delete" ON public.properties FOR DELETE TO authenticated USING (auth.uid() = host_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "bookings read" ON public.bookings FOR SELECT TO authenticated USING (
  auth.uid() = tourist_id
  OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.host_id = auth.uid())
);
CREATE POLICY "bookings insert own" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = tourist_id);
CREATE POLICY "bookings update" ON public.bookings FOR UPDATE TO authenticated USING (
  auth.uid() = tourist_id
  OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.host_id = auth.uid())
) WITH CHECK (true);

CREATE POLICY "reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews insert own" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rewards own" ON public.rewards FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "rewards insert own" ON public.rewards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rewards update own" ON public.rewards FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  chosen public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''))
  ON CONFLICT (id) DO NOTHING;

  chosen := CASE WHEN NEW.raw_user_meta_data->>'role' IN ('tourist','host','admin')
                 THEN (NEW.raw_user_meta_data->>'role')::public.app_role
                 ELSE 'tourist'::public.app_role END;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, chosen)
  ON CONFLICT DO NOTHING;

  IF chosen = 'host' THEN
    INSERT INTO public.host_profiles (user_id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name','Local Host'))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- demo data
INSERT INTO public.properties (host_name, host_verified, name, location, description, price_per_night, amenities, photos, latitude, longitude, available_from, available_to, status, location_verified, rating, review_count) VALUES
('Sunita Kale', true, 'Forest Edge Homestay', 'Bhimashankar', 'A warm village room at the edge of the Bhimashankar wildlife sanctuary. Home-cooked Maharashtrian meals and guided early-morning forest walks with the family.', 1200, ARRAY['Home-cooked meals','Hot water','Forest view','Guided walk','Wi-Fi'], ARRAY['/images/bhimashankar.jpg'], 19.0728, 73.5360, CURRENT_DATE, CURRENT_DATE + 180, 'approved', true, 4.8, 2),
('Ramesh Jadhav', true, 'Fort View Farm Room', 'Visapur Fort', 'Stone farmhouse room right below Visapur Fort. Perfect base for sunrise treks, with chai and poha before you set off.', 900, ARRAY['Trek guide','Breakfast','Parking','Bonfire'], ARRAY['/images/visapur.jpg'], 18.7480, 73.4790, CURRENT_DATE, CURRENT_DATE + 180, 'approved', true, 4.6, 1),
('Meera Deshpande', false, 'Misty Valley Balcony Stay', 'Lonavala', 'A bright room with a private balcony over the valley. Monsoon views, filter coffee and a local food trail with your host.', 1800, ARRAY['Balcony','Valley view','Wi-Fi','AC','Breakfast'], ARRAY['/images/lonavala.jpg'], 18.7546, 73.4062, CURRENT_DATE, CURRENT_DATE + 180, 'approved', true, 4.9, 2),
('Aditya Kulkarni', true, 'Peth Wada Room', 'Pune', 'A heritage wada room in old Pune. Walk to Shaniwar Wada, and join the family for an evening street-food walk in Tulshibaug.', 1100, ARRAY['Wi-Fi','AC','City walk','Breakfast','Workspace'], ARRAY['/images/pune.jpg'], 18.5196, 73.8553, CURRENT_DATE, CURRENT_DATE + 180, 'approved', true, 4.7, 1);

INSERT INTO public.reviews (property_id, author_name, rating, comment)
SELECT id, 'Ankita R.', 5, 'Felt like staying with family. The morning forest walk was unforgettable.' FROM public.properties WHERE name = 'Forest Edge Homestay';
INSERT INTO public.reviews (property_id, author_name, rating, comment)
SELECT id, 'Rohit S.', 5, 'Cheapest and warmest stay we found near the sanctuary.' FROM public.properties WHERE name = 'Forest Edge Homestay';
INSERT INTO public.reviews (property_id, author_name, rating, comment)
SELECT id, 'Karan M.', 5, 'Host woke up at 4am to make us tea before the trek. Legend.' FROM public.properties WHERE name = 'Fort View Farm Room';
INSERT INTO public.reviews (property_id, author_name, rating, comment)
SELECT id, 'Priya N.', 5, 'The balcony in the rain is worth every rupee.' FROM public.properties WHERE name = 'Misty Valley Balcony Stay';
INSERT INTO public.reviews (property_id, author_name, rating, comment)
SELECT id, 'Devika P.', 5, 'Beautiful old wada, and the food walk was the highlight of our trip.' FROM public.properties WHERE name = 'Misty Valley Balcony Stay';
INSERT INTO public.reviews (property_id, author_name, rating, comment)
SELECT id, 'Sameer T.', 4, 'Great location in the old city, very easy to walk everywhere.' FROM public.properties WHERE name = 'Peth Wada Room';
