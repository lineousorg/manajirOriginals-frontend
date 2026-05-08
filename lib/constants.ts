/**
 * Application constants
 */

export const DELIVERY_CHARGES = {
  INSIDE_DHAKA: parseInt(process.env.NEXT_PUBLIC_DELIVERY_CHARGE_INSIDE_DHAKA || "70", 10),
  OUTSIDE_DHAKA: parseInt(process.env.NEXT_PUBLIC_DELIVERY_CHARGE_OUTSIDE_DHAKA || "120", 10),
} as const;

export const DELIVERY_LOCATIONS = {
  INSIDE_DHAKA: "inside_dhaka" as const,
  OUTSIDE_DHAKA: "outside_dhaka" as const,
};

export type DeliveryLocation = (typeof DELIVERY_LOCATIONS)[keyof typeof DELIVERY_LOCATIONS];
