import { LoginForm } from '../features/auth/LoginForm';

export const LoginPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 p-8 border border-border rounded-xl shadow-sm bg-background">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Unified POS</h1>
          <p className="text-sm text-muted-foreground">Sign in to your business account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};
