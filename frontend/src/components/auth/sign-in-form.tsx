"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input, InputGroup } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean(),
});

type Values = z.infer<typeof schema>;

/**
 * Sign-in form. Validation is real; submitting is not wired yet because the auth service doesn't
 * exist. When it does: call `apiFetch("/v1/auth/...")`, branch on `ApiError.errorCode`, and show
 * `userMessageFor(error)` in the alert (see AGENTS.md > Data and errors).
 */
export function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = async () => {
    setNotice(false);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setNotice(true);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
      {notice && (
        <Alert
          tone="info"
          title="Sign-in isn't available yet"
          onDismiss={() => setNotice(false)}
        >
          The authentication service is still being built. Your details were not
          sent anywhere.
        </Alert>
      )}

      <Field label="Email" error={errors.email?.message}>
        <InputGroup start={<Mail aria-hidden="true" />}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
          />
        </InputGroup>
      </Field>

      <div className="grid gap-1.5">
        <Field label="Password" error={errors.password?.message}>
          <InputGroup
            end={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" />
                ) : (
                  <Eye aria-hidden="true" />
                )}
              </Button>
            }
          >
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              {...register("password")}
            />
          </InputGroup>
        </Field>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="w-fit justify-self-end text-label"
          onClick={() =>
            toast.info("Password reset isn't available yet", {
              description: "It arrives together with the auth service.",
            })
          }
        >
          Forgot password?
        </Button>
      </div>

      <div className="flex items-center gap-2.5">
        <Checkbox
          id="remember"
          checked={watch("remember")}
          onCheckedChange={(checked) => setValue("remember", checked === true)}
        />
        <Label htmlFor="remember" className="font-normal text-body-sm">
          Keep me signed in on this device
        </Label>
      </div>

      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Sign in
        <ArrowRight aria-hidden="true" />
      </Button>
    </form>
  );
}
