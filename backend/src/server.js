import 'dotenv/config';
import { assertJwtConfig } from './lib/jwt.js';
import { app } from './app.js';

// Локально/на VPS лучше упасть сразу, чем работать с пустым или слабым JWT_SECRET.
try {
  assertJwtConfig();
} catch (err) {
  console.error(`Не могу запуститься: ${err.message}`);
  process.exit(1);
}

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`legashion backend слушает на порту ${port}`);
});
