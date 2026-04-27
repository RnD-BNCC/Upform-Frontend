import { darkenHex, lightenHex } from "@/utils/game";

export function drawCanvasBall(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
) {
  const gradient = context.createRadialGradient(
    x - radius * 0.32,
    y - radius * 0.35,
    radius * 0.04,
    x,
    y,
    radius,
  );
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.14, lightenHex(color, 55));
  gradient.addColorStop(0.5, color);
  gradient.addColorStop(1, darkenHex(color, 42));

  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fillStyle = gradient;
  context.fill();

  context.beginPath();
  context.ellipse(
    x,
    y + radius * 0.78,
    radius * 0.78,
    radius * 0.18,
    0,
    0,
    Math.PI * 2,
  );
  context.fillStyle = "rgba(0,0,0,0.18)";
  context.fill();

  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fillStyle = gradient;
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.55)";
  context.lineWidth = 1.2;
  context.stroke();

  const specularGradient = context.createRadialGradient(
    x - radius * 0.3,
    y - radius * 0.34,
    0,
    x - radius * 0.3,
    y - radius * 0.34,
    radius * 0.38,
  );
  specularGradient.addColorStop(0, "rgba(255,255,255,0.92)");
  specularGradient.addColorStop(1, "rgba(255,255,255,0)");

  context.beginPath();
  context.arc(x - radius * 0.3, y - radius * 0.34, radius * 0.38, 0, Math.PI * 2);
  context.fillStyle = specularGradient;
  context.fill();

  context.beginPath();
  context.arc(x - radius * 0.36, y - radius * 0.4, radius * 0.11, 0, Math.PI * 2);
  context.fillStyle = "rgba(255,255,255,0.95)";
  context.fill();
}
