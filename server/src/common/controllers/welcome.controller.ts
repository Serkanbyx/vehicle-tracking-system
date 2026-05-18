import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Controller, Get, Header } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "../decorators/public.decorator";

const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"));

@ApiExcludeController()
@Controller()
export class WelcomeController {
  @Get()
  @Public()
  @SkipThrottle()
  @Header("Content-Type", "text/html")
  welcome(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vehicle Tracking System</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: #0a0e1a;
      color: #e0e6f0;
      overflow: hidden;
      position: relative;
    }

    body::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 59px,
          rgba(0, 200, 255, 0.04) 59px,
          rgba(0, 200, 255, 0.04) 60px
        ),
        repeating-linear-gradient(
          90deg,
          transparent,
          transparent 59px,
          rgba(0, 200, 255, 0.04) 59px,
          rgba(0, 200, 255, 0.04) 60px
        );
      pointer-events: none;
    }

    body::after {
      content: '';
      position: absolute;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      border: 1px solid rgba(0, 200, 255, 0.06);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: radarPulse 4s ease-out infinite;
      pointer-events: none;
    }

    @keyframes radarPulse {
      0% { width: 100px; height: 100px; opacity: 0.5; border-color: rgba(0, 200, 255, 0.15); }
      100% { width: 700px; height: 700px; opacity: 0; border-color: rgba(0, 200, 255, 0); }
    }

    .container {
      text-align: center;
      z-index: 1;
      padding: 3rem 2rem;
      max-width: 520px;
      width: 100%;
    }

    .icon {
      width: 70px;
      height: 70px;
      margin: 0 auto 1.5rem;
      position: relative;
    }

    .icon::before {
      content: '';
      position: absolute;
      width: 40px;
      height: 40px;
      border: 3px solid #00c8ff;
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 20px rgba(0, 200, 255, 0.3);
    }

    .icon::after {
      content: '';
      position: absolute;
      width: 10px;
      height: 10px;
      background: #00ffa3;
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 12px rgba(0, 255, 163, 0.6);
      animation: blink 2s ease-in-out infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    h1 {
      font-size: 1.8rem;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      background: linear-gradient(135deg, #00c8ff 0%, #00ffa3 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
    }

    .version {
      font-size: 0.85rem;
      color: rgba(0, 200, 255, 0.6);
      font-family: 'Cascadia Code', 'Fira Code', monospace;
      letter-spacing: 2px;
      margin-bottom: 2.5rem;
    }

    .links {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      align-items: center;
      margin-bottom: 3rem;
    }

    .links a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 260px;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      letter-spacing: 1px;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, rgba(0, 200, 255, 0.15), rgba(0, 255, 163, 0.1));
      border: 1px solid rgba(0, 200, 255, 0.3);
      color: #00c8ff;
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, rgba(0, 200, 255, 0.25), rgba(0, 255, 163, 0.15));
      border-color: #00c8ff;
      box-shadow: 0 0 25px rgba(0, 200, 255, 0.2);
      transform: translateY(-2px);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(224, 230, 240, 0.7);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(0, 255, 163, 0.4);
      color: #00ffa3;
      box-shadow: 0 0 20px rgba(0, 255, 163, 0.1);
      transform: translateY(-2px);
    }

    footer.sign {
      font-size: 0.8rem;
      color: rgba(224, 230, 240, 0.35);
      letter-spacing: 0.5px;
    }

    footer.sign a {
      color: rgba(0, 200, 255, 0.5);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    footer.sign a:hover {
      color: #00c8ff;
    }

    @media (max-width: 480px) {
      h1 { font-size: 1.4rem; letter-spacing: 2px; }
      .links a { width: 100%; }
      .container { padding: 2rem 1.5rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon"></div>
    <h1>Vehicle Tracking System</h1>
    <p class="version">v${pkg.version}</p>
    <div class="links">
      <a href="/api-docs" class="btn-primary">API Documentation</a>
      <a href="/api/health" class="btn-secondary">Health Check</a>
    </div>
    <footer class="sign">
      Created by
      <a href="https://serkanbayraktar.com/" target="_blank" rel="noopener noreferrer">Serkanby</a>
      |
      <a href="https://github.com/Serkanbyx" target="_blank" rel="noopener noreferrer">Github</a>
    </footer>
  </div>
</body>
</html>`;
  }
}
