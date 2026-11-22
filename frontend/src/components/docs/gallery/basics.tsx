"use client";

import {
  ArrowRight,
  Download,
  IndianRupee,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input, InputGroup } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadioCard,
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Caption, Preview, Row } from "./frame";

export function GalleryButtons() {
  const [loading, setLoading] = useState(false);
  return (
    <Preview
      title="Buttons"
      description="One primary (ink) per view. Secondary for the rest, brand green sparingly for positive confirmations, danger only for irreversible actions."
    >
      <div className="grid gap-6">
        <div className="grid gap-2.5">
          <Caption>Variants</Caption>
          <Row>
            <Button>
              <Send aria-hidden="true" /> Send money
            </Button>
            <Button variant="secondary">Cancel</Button>
            <Button variant="brand">Confirm transfer</Button>
            <Button variant="subtle">Subtle</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">View statement</Button>
            <Button variant="danger">
              <Trash2 aria-hidden="true" /> Remove payee
            </Button>
          </Row>
        </div>
        <div className="grid gap-2.5">
          <Caption>Sizes</Caption>
          <Row>
            <Button size="xs">Extra small</Button>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">
              Large <ArrowRight aria-hidden="true" />
            </Button>
          </Row>
        </div>
        <div className="grid gap-2.5">
          <Caption>States and icon buttons</Caption>
          <Row>
            <Button
              loading={loading}
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 1600);
              }}
            >
              Click to load
            </Button>
            <Button disabled>Disabled</Button>
            <Button variant="secondary" size="icon" aria-label="Add">
              <Plus aria-hidden="true" />
            </Button>
            <Button variant="secondary" size="icon" aria-label="Download">
              <Download aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="More actions">
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </Row>
        </div>
      </div>
    </Preview>
  );
}

export function GalleryForms() {
  const [speed, setSpeed] = useState("imps");
  return (
    <Preview
      title="Inputs and forms"
      description="Labels above fields, hints below, errors replace hints. Every control works with the keyboard and screen readers."
    >
      <div className="grid gap-8 md:grid-cols-2">
        <div className="grid content-start gap-5">
          <Field label="Payee name" hint="As it appears on their account">
            <Input placeholder="Priya Sharma" />
          </Field>
          <Field
            label="Amount"
            hint="Transfers of ₹50,000 or more need a one-time code"
          >
            <InputGroup start={<IndianRupee aria-hidden="true" />} end="INR">
              <Input
                inputMode="decimal"
                placeholder="0.00"
                className="numeric"
              />
            </InputGroup>
          </Field>
          <Field label="Account number" error="Enter a 12-digit account number">
            <Input defaultValue="4821 0092" className="font-mono" />
          </Field>
          <Field label="Search">
            <InputGroup start={<Search aria-hidden="true" />}>
              <Input type="search" placeholder="Search transactions" />
            </InputGroup>
          </Field>
          <Field label="Note" labelSuffix="Optional">
            <Textarea placeholder="What's this for?" />
          </Field>
        </div>

        <div className="grid content-start gap-5">
          <Field label="From account">
            <Select defaultValue="savings">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Your accounts</SelectLabel>
                  <SelectItem value="savings">Savings •••• 4821</SelectItem>
                  <SelectItem value="current">Current •••• 7710</SelectItem>
                  <SelectItem value="joint" disabled>
                    Joint •••• 0034 (frozen)
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <fieldset className="grid gap-2">
            <legend className="mb-1.5 font-medium text-label text-foreground">
              Transfer speed
            </legend>
            <RadioGroup value={speed} onValueChange={setSpeed}>
              <RadioCard
                value="imps"
                title="Instant (IMPS)"
                description="Arrives in seconds, any time"
                aside="Free"
              />
              <RadioCard
                value="neft"
                title="Standard (NEFT)"
                description="Settles in batches during the day"
                aside="Free"
              />
              <RadioCard
                value="rtgs"
                title="High value (RTGS)"
                description="₹2,00,000 and above"
                disabled
              />
            </RadioGroup>
          </fieldset>

          <div className="grid gap-3">
            <div className="flex items-center gap-2.5">
              <Checkbox id="g-save" defaultChecked />
              <Label htmlFor="g-save" className="font-normal text-body-sm">
                Save as a payee
              </Label>
            </div>
            <div className="flex items-center gap-2.5">
              <Checkbox id="g-some" checked="indeterminate" />
              <Label htmlFor="g-some" className="font-normal text-body-sm">
                Some selected (indeterminate)
              </Label>
            </div>
            <RadioGroup defaultValue="email" className="flex gap-5">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="email" id="g-email" />
                <Label htmlFor="g-email" className="font-normal text-body-sm">
                  Email receipt
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="sms" id="g-sms" />
                <Label htmlFor="g-sms" className="font-normal text-body-sm">
                  SMS
                </Label>
              </div>
            </RadioGroup>
            <div className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-3">
              <div className="grid gap-0.5">
                <Label htmlFor="g-online">Online card payments</Label>
                <span className="text-caption text-muted-foreground">
                  Applies immediately
                </span>
              </div>
              <Switch id="g-online" defaultChecked />
            </div>
          </div>
        </div>
      </div>
    </Preview>
  );
}
