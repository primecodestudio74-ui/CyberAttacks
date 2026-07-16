import AuthLayout from "../../components/Auth/AuthLayout";
import LoginForm from "../../components/Auth/LoginForm";

const Login = () => {
  return (
    <AuthLayout
  title="Welcome Back"
  subtitle="Sign in to continue to HackAware."
>
  <LoginForm />
</AuthLayout>
  );
};

export default Login;

