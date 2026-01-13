-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('patient', 'hospital');

-- Create user roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create health profiles table
CREATE TABLE public.health_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    age INTEGER,
    gender TEXT,
    blood_group TEXT,
    conditions TEXT,
    allergies TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on health_profiles
ALTER TABLE public.health_profiles ENABLE ROW LEVEL SECURITY;

-- Create emergency contacts table
CREATE TABLE public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    relation TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on emergency_contacts
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Create fall events table
CREATE TABLE public.fall_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_emergency BOOLEAN NOT NULL DEFAULT false,
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on fall_events
ALTER TABLE public.fall_events ENABLE ROW LEVEL SECURITY;

-- Create sensor data table
CREATE TABLE public.sensor_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    accelerometer_x DOUBLE PRECISION,
    accelerometer_y DOUBLE PRECISION,
    accelerometer_z DOUBLE PRECISION,
    gyroscope_x DOUBLE PRECISION,
    gyroscope_y DOUBLE PRECISION,
    gyroscope_z DOUBLE PRECISION,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sensor_data
ALTER TABLE public.sensor_data ENABLE ROW LEVEL SECURITY;

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    related_event_id UUID REFERENCES public.fall_events(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create hospital patient assignments table
CREATE TABLE public.hospital_patient_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    patient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (hospital_user_id, patient_user_id)
);

-- Enable RLS on hospital_patient_assignments
ALTER TABLE public.hospital_patient_assignments ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- Function to check if hospital can access patient data
CREATE OR REPLACE FUNCTION public.hospital_can_access_patient(_hospital_user_id UUID, _patient_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        -- Check if patient has active emergency
        SELECT 1 FROM public.fall_events
        WHERE user_id = _patient_user_id
        AND is_emergency = true
        AND resolved = false
    ) OR EXISTS (
        -- Check if patient is explicitly assigned to this hospital
        SELECT 1 FROM public.hospital_patient_assignments
        WHERE hospital_user_id = _hospital_user_id
        AND patient_user_id = _patient_user_id
        AND active = true
    )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Hospitals can view patient profiles during emergency or assignment"
ON public.profiles FOR SELECT
USING (
    public.has_role(auth.uid(), 'hospital') AND
    public.hospital_can_access_patient(auth.uid(), user_id)
);

-- RLS Policies for health_profiles
CREATE POLICY "Users can view their own health profile"
ON public.health_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own health profile"
ON public.health_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health profile"
ON public.health_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Hospitals can view patient health profiles during emergency or assignment"
ON public.health_profiles FOR SELECT
USING (
    public.has_role(auth.uid(), 'hospital') AND
    public.hospital_can_access_patient(auth.uid(), user_id)
);

-- RLS Policies for emergency_contacts
CREATE POLICY "Users can manage their own emergency contacts"
ON public.emergency_contacts FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for fall_events
CREATE POLICY "Users can view their own fall events"
ON public.fall_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fall events"
ON public.fall_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fall events"
ON public.fall_events FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Hospitals can view fall events during emergency or assignment"
ON public.fall_events FOR SELECT
USING (
    public.has_role(auth.uid(), 'hospital') AND
    public.hospital_can_access_patient(auth.uid(), user_id)
);

CREATE POLICY "Hospitals can update fall events to resolve"
ON public.fall_events FOR UPDATE
USING (
    public.has_role(auth.uid(), 'hospital') AND
    public.hospital_can_access_patient(auth.uid(), user_id)
);

-- RLS Policies for sensor_data
CREATE POLICY "Users can manage their own sensor data"
ON public.sensor_data FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Hospitals can view sensor data during emergency or assignment"
ON public.sensor_data FOR SELECT
USING (
    public.has_role(auth.uid(), 'hospital') AND
    public.hospital_can_access_patient(auth.uid(), user_id)
);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for hospital_patient_assignments
CREATE POLICY "Hospitals can view their own assignments"
ON public.hospital_patient_assignments FOR SELECT
USING (auth.uid() = hospital_user_id);

CREATE POLICY "Hospitals can manage their assignments"
ON public.hospital_patient_assignments FOR ALL
USING (
    public.has_role(auth.uid(), 'hospital') AND
    auth.uid() = hospital_user_id
);

-- Trigger function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email
    );
    
    -- Default role is patient
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient'));
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_profiles_updated_at
    BEFORE UPDATE ON public.health_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at
    BEFORE UPDATE ON public.emergency_contacts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.fall_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_data;