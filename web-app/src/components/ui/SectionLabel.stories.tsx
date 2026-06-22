import type { Meta, StoryObj } from "@storybook/react";
import { SectionLabel } from "./SectionLabel";

const meta: Meta<typeof SectionLabel> = {
  title: "UI/SectionLabel",
  component: SectionLabel,
  args: { children: "Choose a Song" },
};
export default meta;

type Story = StoryObj<typeof SectionLabel>;
export const Default: Story = {};
export const Required: Story = { args: { required: true } };
