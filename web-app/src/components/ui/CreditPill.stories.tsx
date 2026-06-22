import type { Meta, StoryObj } from "@storybook/react";
import { CreditPill } from "./CreditPill";

const meta: Meta<typeof CreditPill> = {
  title: "UI/CreditPill",
  component: CreditPill,
  args: { credits: 390 },
};
export default meta;

type Story = StoryObj<typeof CreditPill>;
export const Default: Story = {};
export const Low: Story = { args: { credits: 12 } };
