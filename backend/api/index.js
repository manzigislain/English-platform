const { NestFactory } = require("@nestjs/core");
const { ValidationPipe } = require("@nestjs/common");

let cachedApp;

async function bootstrap() {
  if (!cachedApp) {
    const { AppModule } = require("./dist/src/app.module");

    const app = await NestFactory.create(AppModule, { rawBody: true });

    const corsOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
      : [/\.vercel\.app$/, process.env.NEXT_PUBLIC_API_URL].filter(Boolean);

    app.enableCors({
      origin: corsOrigins,
      credentials: true,
    });

    app.setGlobalPrefix("api");

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    // Handle Stripe raw body parsing
    app.use((req, res, next) => {
      if (req.url === "/api/payments/stripe/webhook") {
        let data = "";
        req.on("data", (chunk) => (data += chunk));
        req.on("end", () => {
          req.rawBody = data;
          next();
        });
      } else {
        next();
      }
    });

    await app.init();
    cachedApp = app;
  }
  return cachedApp;
}

module.exports = async (req, res) => {
  try {
    const app = await bootstrap();
    const instance = app.getHttpAdapter().getInstance();
    instance(req, res);
  } catch (error) {
    console.error("NestJS handler error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Internal Server Error", message: error.message }));
  }
};
