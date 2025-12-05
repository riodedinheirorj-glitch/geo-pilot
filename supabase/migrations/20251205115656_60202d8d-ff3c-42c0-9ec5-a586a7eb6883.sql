-- Atualizar função para dar 3 créditos de boas-vindas
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Criar perfil
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Criar role de usuário padrão
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Criar créditos iniciais (3 créditos de boas-vindas)
  INSERT INTO public.user_credits (user_id, credits)
  VALUES (NEW.id, 3);
  
  -- Registrar transação de bônus inicial
  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (NEW.id, 'initial_signup_bonus', 3, 'Créditos de boas-vindas no cadastro');
  
  RETURN NEW;
END;
$function$;