import AuthLayout from "../../components/Auth/AuthLayout";
import SignupForm from "../../components/Auth/SignupForm";

const Signup = () => {
  return (
    <AuthLayout
  title="Create Account"
  subtitle="Join HackAware and start your cybersecurity journey."
>
  <SignupForm />
</AuthLayout>
  );
};

export default Signup;

