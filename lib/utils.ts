import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Simple pseudo-random number generator for deterministic chaos
export function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

export function getRandomInt(min: number, max: number, rng: () => number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function getRandomItem<T>(array: T[], rng: () => number): T {
  return array[Math.floor(rng() * array.length)];
}