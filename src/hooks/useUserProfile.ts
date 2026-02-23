import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  cpf: string | null;
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("id, full_name, email, phone, cpf")
      .eq("id", user.id)
      .maybeSingle();

    if (data && !error) {
      setProfile(data);
    } else {
      const meta = user.user_metadata;
      setProfile({
        id: user.id,
        full_name: meta?.full_name || meta?.name || null,
        email: user.email || null,
        phone: meta?.phone || null,
        cpf: meta?.cpf || null,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  const firstName = profile?.full_name?.split(" ")[0] || "Motorista";

  return { profile, loading, firstName, refetch: fetchProfile };
};
