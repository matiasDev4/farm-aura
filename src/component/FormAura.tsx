import { useEffect, useState } from "react";
import QRCode from "qrcode";

type AuraProfile = {
  username: string;
  aura: number;
  quality: number;
  style: number;
  presence: number;
  rarity: number;
  impact: number;
  rank: string;
  message: string;
  accent: string;
};

type CanvasPaint =
  | string
  | CanvasGradient
  | CanvasPattern;

const SITE_URL = "https://aura.kodari.xyz";

const clamp = (
  value: number,
  min = 0,
  max = 100
) => {
  return Math.max(min, Math.min(max, value));
};

const cleanUsername = (value: string) => {
  return value
    .trim()
    .replace(/^@/, "")
    .replace(/\s/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "");
};

const hashString = (value: string) => {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const randomFromSeed = (
  seed: number,
  salt: number
) => {
  let x = (seed ^ salt) >>> 0;

  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;

  return (x >>> 0) / 4294967295;
};

const getNameQuality = (
  username: string
) => {
  const clean = username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (!clean) {
    return 1;
  }

  const letters =
    clean.match(/[a-z]/g) ?? [];

  const vowels =
    clean.match(/[aeiou]/g) ?? [];

  if (!letters.length) {
    return 8;
  }

  let quality = 66;

  const vowelRatio =
    vowels.length / letters.length;

  const uniqueRatio =
    new Set(letters).size /
    Math.max(letters.length, 1);

  const keyboardSpam =
    /asdf|sdfg|dfgh|fghj|ghjk|qwer|wert|erty|zxcv|xcvb|qaz|wsx|edc|rfv|tgb/i.test(
      clean
    );

  const repeatedPattern =
    /^(.{1,3})\1{1,}$/i.test(clean);

  const repeatedLetters =
    /(.)\1{2,}/i.test(clean);

  const repeatedPairs =
    /(.{2})\1{1,}/i.test(clean);

  const badConsonants =
    /[bcdfghjklmnpqrstvwxyz]{4,}/i.test(
      clean
    );

  const mediumConsonants =
    /[bcdfghjklmnpqrstvwxyz]{3,}/i.test(
      clean
    );

  const onlyNumbers =
    /^\d+$/.test(clean);

  const randomLetters =
    /^[a-z]{6,}$/i.test(clean) &&
    vowelRatio < 0.2;

  const tooManyRareLetters =
    (
      clean.match(/[qxzjk]/g) ?? []
    ).length >= 2;

  if (
    vowelRatio >= 0.28 &&
    vowelRatio <= 0.62
  ) {
    quality += 13;
  } else {
    quality -= 10;
  }

  if (uniqueRatio >= 0.75) {
    quality += 8;
  }

  if (uniqueRatio < 0.5) {
    quality -= 15;
  }

  if (keyboardSpam) {
    quality -= 55;
  }

  if (repeatedPattern) {
    quality -= 50;
  }

  if (repeatedLetters) {
    quality -= 18;
  }

  if (repeatedPairs) {
    quality -= 20;
  }

  if (badConsonants) {
    quality -= 32;
  } else if (mediumConsonants) {
    quality -= 15;
  }

  if (tooManyRareLetters) {
    quality -= 16;
  }

  if (randomLetters) {
    quality -= 35;
  }

  if (
    onlyNumbers &&
    clean !== "777" &&
    clean !== "666" &&
    clean !== "404"
  ) {
    quality -= 20;
  }

  if (clean.length <= 2) {
    quality -= 10;
  }

  if (clean.length === 3) {
    if (vowelRatio >= 0.33) {
      quality += 10;
    } else {
      quality -= 15;
    }
  }

  if (
    clean.length >= 3 &&
    clean.length <= 8 &&
    vowelRatio >= 0.3 &&
    vowelRatio <= 0.6 &&
    uniqueRatio >= 0.65
  ) {
    quality += 12;
  }

  if (
    clean.length >= 4 &&
    clean.length <= 7 &&
    uniqueRatio >= 0.8
  ) {
    quality += 8;
  }

  return Math.round(
    clamp(quality, 1, 100)
  );
};

const getMessage = (
  username: string,
  aura: number,
  seed: number,
  quality: number
) => {
  const clean = username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (quality < 20) {
    const messages = [
      "¿Eso es un nombre o un accidente?",
      "Demasiadas teclas juntas.",
      "Acá faltó pensar el nombre.",
      "El aura pidió que lo intentes de nuevo.",
      "Parece generado por un teclado.",
      "No hay mucho que defender acá.",
    ];

    return messages[
      Math.floor(
        randomFromSeed(seed, 404) *
          messages.length
      )
    ];
  }

  if (quality < 35) {
    return "Tiene potencial, pero algo no termina de cerrar.";
  }

  if (/^\d+$/.test(clean)) {
    if (clean === "777") {
      return "Esto ya parece intencional.";
    }

    if (clean === "666") {
      return "Demasiado específico para ser casualidad.";
    }

    return "Pocas letras. Mucha intención.";
  }

  if (clean.length === 1) {
    return "Una letra. Demasiada confianza.";
  }

  if (
    clean.includes("x") &&
    clean.length <= 4
  ) {
    return "Corto, raro y bastante seguro.";
  }

  if (
    clean.includes("_") &&
    username.length >= 8
  ) {
    return "Hay planificación detrás de este nombre.";
  }

  if (/(.)\1/i.test(clean)) {
    return "Una repetición bien puesta cambia todo.";
  }

  if (clean.length <= 3) {
    return "Simple. Limpio. Funciona.";
  }

  if (clean.length <= 5) {
    return "Nombre corto. Presencia pesada.";
  }

  if (aura >= 9500) {
    return "Esto ya dejó de ser un nombre normal.";
  }

  if (aura >= 9000) {
    return "Hay demasiada presencia acá.";
  }

  const messages = [
    "No parece gran cosa. Ese es el truco.",
    "Tiene algo que funciona.",
    "Hay presencia. Y bastante.",
    "El nombre entra y se hace notar.",
    "No sabemos exactamente por qué, pero funciona.",
    "Una combinación bastante seria.",
    "Hay nombres que simplemente tienen aura.",
  ];

  return messages[
    Math.floor(
      randomFromSeed(seed, 900) *
        messages.length
    )
  ];
};

const calculateProfile = (
  username: string
): AuraProfile => {
  const seed = hashString(username);
  const length = username.length;

  const numbers =
    username.match(/[0-9]/g) ?? [];

  const unique =
    new Set(
      username.toLowerCase()
    ).size;

  const uniqueRatio =
    unique /
    Math.max(length, 1);

  const quality =
    getNameQuality(username);

  let aura =
    1900 +
    quality * 54;

  if (
    length >= 3 &&
    length <= 5 &&
    quality >= 75
  ) {
    aura += 500;
  }

  if (
    length >= 4 &&
    length <= 8 &&
    quality >= 82
  ) {
    aura += 300;
  }

  const variation =
    Math.round(
      randomFromSeed(seed, 777) *
        420
    ) - 210;

  aura += variation;

  if (
    numbers.length > 0 &&
    quality >= 65
  ) {
    aura += 100;
  }

  if (
    username.includes("_") &&
    quality >= 65
  ) {
    aura += 70;
  }

  if (quality < 20) {
    aura =
      650 +
      Math.round(
        randomFromSeed(seed, 123) *
          950
      );
  } else if (quality < 35) {
    aura =
      1500 +
      Math.round(
        randomFromSeed(seed, 234) *
          1000
      );
  } else if (quality < 50) {
    aura =
      2700 +
      Math.round(
        randomFromSeed(seed, 345) *
          1100
      );
  }

  if (quality >= 88) {
    aura += 300;
  }

  if (quality >= 94) {
    aura += 350;
  }

  if (
    length >= 3 &&
    length <= 5 &&
    quality >= 90 &&
    uniqueRatio >= 0.75
  ) {
    aura += 350;
  }

  aura = Math.round(
    clamp(aura, 500, 9999)
  );

  let rank = "";
  let accent = "#5865F2";

  if (aura >= 9500) {
    rank = "ANOMALÍA";
    accent = "#facc15";
  } else if (aura >= 9000) {
    rank = "JEFE FINAL";
    accent = "#facc15";
  } else if (aura >= 8200) {
    rank = "ÉLITE";
    accent = "#f59e0b";
  } else if (aura >= 7400) {
    rank = "DOMINANTE";
    accent = "#8b7cf6";
  } else if (aura >= 6200) {
    rank = "FUERTE";
    accent = "#5865F2";
  } else if (aura >= 4800) {
    rank = "NORMAL";
    accent = "#5865F2";
  } else if (aura >= 3000) {
    rank = "DUDOSO";
    accent = "#5865F2";
  } else {
    rank = "SIN AURA";
    accent = "#5865F2";
  }

  const style = Math.round(
    clamp(
      quality +
        randomFromSeed(seed, 31) *
          15 -
        7
    )
  );

  const presence = Math.round(
    clamp(
      quality +
        randomFromSeed(seed, 53) *
          15 -
        7
    )
  );

  const rarity = Math.round(
    clamp(
      quality +
        uniqueRatio * 10 +
        randomFromSeed(seed, 71) *
          12 -
        8
    )
  );

  const impact = Math.round(
    clamp(
      quality +
        randomFromSeed(seed, 97) *
          15 -
        7
    )
  );

  return {
    username,
    aura,
    quality,
    style,
    presence,
    rarity,
    impact,
    rank,
    message: getMessage(
      username,
      aura,
      seed,
      quality
    ),
    accent,
  };
};

const getInitials = (
  username: string
) => {
  const value = username
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 2);

  return value.toUpperCase() || "A";
};

const formatAura = (
  value: number
) => {
  return value.toLocaleString("es-AR");
};

const getProfileUrl = (
  username: string
) => {
  return `${SITE_URL}/?u=${encodeURIComponent(
    username
  )}`;
};

/* ============================================================
   CANVAS
   ============================================================ */

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const r = Math.min(
    radius,
    width / 2,
    height / 2
  );

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(
    x + width,
    y,
    x + width,
    y + r
  );
  ctx.lineTo(
    x + width,
    y + height - r
  );
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - r,
    y + height
  );
  ctx.lineTo(
    x + r,
    y + height
  );
  ctx.quadraticCurveTo(
    x,
    y + height,
    x,
    y + height - r
  );
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(
    x,
    y,
    x + r,
    y
  );
  ctx.closePath();
};

const fillRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: CanvasPaint
) => {
  roundRect(
    ctx,
    x,
    y,
    width,
    height,
    radius
  );

  ctx.fillStyle = fillStyle;
  ctx.fill();
};

const strokeRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  strokeStyle: CanvasPaint,
  lineWidth = 1
) => {
  roundRect(
    ctx,
    x,
    y,
    width,
    height,
    radius
  );

  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
};

const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    size: number;
    weight?: number;
    color?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    letterSpacing?: number;
  }
) => {
  ctx.save();

  ctx.font = `${options.weight ?? 400} ${options.size}px Inter, Arial, sans-serif`;

  ctx.fillStyle =
    options.color ?? "#ffffff";

  ctx.textAlign =
    options.align ?? "left";

  ctx.textBaseline =
    options.baseline ?? "alphabetic";

  /*
   * Canvas no tiene letter-spacing estándar.
   * Para los textos normales no hace falta.
   */
  if (
    !options.letterSpacing ||
    options.letterSpacing === 0
  ) {
    ctx.fillText(text, x, y);
    ctx.restore();
    return;
  }

  const chars = [...text];
  const widths = chars.map((char) =>
    ctx.measureText(char).width
  );

  const total =
    widths.reduce(
      (sum, value) => sum + value,
      0
    ) +
    options.letterSpacing *
      Math.max(chars.length - 1, 0);

  let cursor = x;

  if (options.align === "center") {
    cursor = x - total / 2;
  } else if (options.align === "right") {
    cursor = x - total;
  }

  chars.forEach((char, index) => {
    ctx.fillText(
      char,
      cursor,
      y
    );

    cursor +=
      widths[index] +
      options.letterSpacing!;
  });

  ctx.restore();
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) => {
  const words = text.split(" ");
  const lines: string[] = [];

  let current = "";

  for (const word of words) {
    const test = current
      ? `${current} ${word}`
      : word;

    if (
      ctx.measureText(test).width <=
      maxWidth
    ) {
      current = test;
    } else {
      if (current) {
        lines.push(current);
      }

      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
};

const createAuraCanvas = async (
  profile: AuraProfile
) => {
  /*
   * Tamaño final de la imagen.
   *
   * Se dibuja a 2x para obtener una imagen
   * nítida en celulares y redes sociales.
   */
  const scale = 2;

  const width = 880;
  const height = 1160;

  const canvas =
    document.createElement("canvas");

  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx =
    canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "No se pudo crear el contexto Canvas."
    );
  }

  ctx.scale(scale, scale);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  /*
   * Fondo.
   */
  ctx.fillStyle = "#090a0e";
  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  /*
   * Glow.
   */
  const glow =
    ctx.createRadialGradient(
      width - 80,
      80,
      20,
      width - 80,
      80,
      420
    );

  glow.addColorStop(
    0,
    `${profile.accent}28`
  );

  glow.addColorStop(
    1,
    "#090a0e00"
  );

  ctx.fillStyle = glow;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  /*
   * CARD PRINCIPAL.
   *
   * Importante:
   * no usamos stroke directamente sobre
   * el borde exterior porque eso puede
   * hacer que visualmente parezca más
   * grueso.
   *
   * En cambio dibujamos primero el fondo
   * y después una línea de 1px centrada.
   */
  fillRoundRect(
    ctx,
    20,
    20,
    width - 40,
    height - 40,
    30,
    "#111318"
  );

  strokeRoundRect(
    ctx,
    20.5,
    20.5,
    width - 41,
    height - 41,
    29.5,
    "#ffffff16",
    1
  );

  /*
   * HEADER.
   */
  fillRoundRect(
    ctx,
    21,
    21,
    width - 42,
    98,
    29,
    "#171920"
  );

  /*
   * Tapamos la parte inferior del rounded
   * header para que quede recto.
   */
  ctx.fillStyle = "#171920";
  ctx.fillRect(
    21,
    80,
    width - 42,
    39
  );

  /*
   * Separador.
   */
  ctx.fillStyle = "#ffffff12";
  ctx.fillRect(
    21,
    118,
    width - 42,
    1
  );

  /*
   * Avatar.
   */
  ctx.beginPath();
  ctx.arc(
    75,
    69,
    25,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    profile.accent;

  ctx.fill();

  drawText(
    ctx,
    getInitials(profile.username),
    75,
    69,
    {
      size: 13,
      weight: 900,
      color: "#ffffff",
      align: "center",
      baseline: "middle",
    }
  );

  /*
   * USERNAME.
   *
   * Tiene una zona independiente.
   * Esto evita que el rank lo tape.
   */
  drawText(
    ctx,
    `@${profile.username}`,
    115,
    64,
    {
      size: 17,
      weight: 700,
      color: "#ffffff",
      baseline: "middle",
    }
  );

  drawText(
    ctx,
    "resultado personal",
    115,
    87,
    {
      size: 11,
      weight: 400,
      color: "#ffffff59",
      baseline: "middle",
    }
  );

  /*
   * RANK.
   *
   * Lo ubicamos siempre dentro de un
   * espacio de 190px.
   */
  drawText(
    ctx,
    profile.rank,
    width - 55,
    69,
    {
      size: 11,
      weight: 900,
      color: profile.accent,
      align: "right",
      baseline: "middle",
      letterSpacing: 1.5,
    }
  );

  /*
   * CONTENIDO.
   */
  const contentX = 55;
  const contentWidth =
    width - 110;

  drawText(
    ctx,
    "NIVEL DE AURA",
    contentX,
    165,
    {
      size: 11,
      weight: 700,
      color: "#ffffff59",
      letterSpacing: 2,
    }
  );

  /*
   * Aura.
   */
  drawText(
    ctx,
    formatAura(profile.aura),
    contentX,
    225,
    {
      size: 65,
      weight: 900,
      color: "#ffffff",
      baseline: "alphabetic",
    }
  );

  drawText(
    ctx,
    "/ 10.000",
    370,
    220,
    {
      size: 12,
      weight: 400,
      color: "#ffffff59",
      baseline: "alphabetic",
    }
  );

  /*
   * Porcentaje.
   */
  drawText(
    ctx,
    `${Math.round(
      (profile.aura / 10000) * 100
    )}%`,
    width - 55,
    198,
    {
      size: 25,
      weight: 900,
      color: profile.accent,
      align: "right",
    }
  );

  drawText(
    ctx,
    "intensidad",
    width - 55,
    220,
    {
      size: 10,
      weight: 500,
      color: "#ffffff4d",
      align: "right",
    }
  );

  /*
   * Barra de aura.
   */
  fillRoundRect(
    ctx,
    contentX,
    250,
    contentWidth,
    11,
    6,
    "#252830"
  );

  const auraGradient =
    ctx.createLinearGradient(
      contentX,
      0,
      contentX + contentWidth,
      0
    );

  auraGradient.addColorStop(
    0,
    "#5865F2"
  );

  auraGradient.addColorStop(
    0.55,
    "#8b7cf6"
  );

  auraGradient.addColorStop(
    1,
    "#facc15"
  );

  const auraWidth =
    contentWidth *
    (profile.aura / 10000);

  if (auraWidth > 0) {
    fillRoundRect(
      ctx,
      contentX,
      250,
      auraWidth,
      11,
      6,
      auraGradient
    );
  }

  /*
   * MESSAGE BOX.
   */
  const messageY = 290;
  const messageHeight = 115;

  fillRoundRect(
    ctx,
    contentX,
    messageY,
    contentWidth,
    messageHeight,
    18,
    "#191b21"
  );

  strokeRoundRect(
    ctx,
    contentX + 0.5,
    messageY + 0.5,
    contentWidth - 1,
    messageHeight - 1,
    17.5,
    "#ffffff0d",
    1
  );

  ctx.font =
    "900 19px Inter, Arial, sans-serif";

  const messageLines =
    wrapText(
      ctx,
      profile.message,
      contentWidth - 48
    );

  const maxMessageLines =
    Math.min(messageLines.length, 3);

  messageLines
    .slice(0, maxMessageLines)
    .forEach((line, index) => {
      drawText(
        ctx,
        line,
        contentX + 24,
        messageY +
          38 +
          index * 25,
        {
          size: 19,
          weight: 900,
          color: "#ffffff",
        }
      );
    });

  drawText(
    ctx,
    `${profile.rank} · firma de aura`,
    contentX + 24,
    messageY + 91,
    {
      size: 10,
      weight: 500,
      color: "#ffffff59",
    }
  );

  /*
   * BADGES / STATS.
   *
   * Cada tarjeta tiene altura fija.
   * El texto está alineado verticalmente
   * para evitar que se vaya hacia abajo.
   */
  const stats = [
    ["ESTILO", profile.style],
    ["PRESENCIA", profile.presence],
    ["RAREZA", profile.rarity],
    ["IMPACTO", profile.impact],
  ] as const;

  const gap = 14;
  const statWidth =
    (contentWidth - gap) / 2;

  const statHeight = 92;
  const statsY = 425;

  stats.forEach(
    ([name, value], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);

      const x =
        contentX +
        column *
          (statWidth + gap);

      const y =
        statsY +
        row *
          (statHeight + gap);

      fillRoundRect(
        ctx,
        x,
        y,
        statWidth,
        statHeight,
        16,
        "#191b21"
      );

      strokeRoundRect(
        ctx,
        x + 0.5,
        y + 0.5,
        statWidth - 1,
        statHeight - 1,
        15.5,
        "#ffffff0a",
        1
      );

      /*
       * Nombre del stat.
       */
      drawText(
        ctx,
        name,
        x + 16,
        y + 26,
        {
          size: 9,
          weight: 700,
          color: "#ffffff59",
          baseline: "middle",
          letterSpacing: 1,
        }
      );

      /*
       * Número.
       */
      drawText(
        ctx,
        String(value),
        x + statWidth - 16,
        y + 26,
        {
          size: 15,
          weight: 900,
          color: profile.accent,
          align: "right",
          baseline: "middle",
        }
      );

      /*
       * Barra.
       */
      const barX = x + 16;
      const barY = y + 55;
      const barWidth =
        statWidth - 32;

      fillRoundRect(
        ctx,
        barX,
        barY,
        barWidth,
        7,
        4,
        "#292c34"
      );

      const progressWidth =
        barWidth * (value / 100);

      if (progressWidth > 0) {
        fillRoundRect(
          ctx,
          barX,
          barY,
          progressWidth,
          7,
          4,
          profile.accent
        );
      }
    }
  );

  /*
   * FOOTER.
   */
  const footerY =
    height - 82;

  ctx.fillStyle = "#0e0f13";

  ctx.fillRect(
    21,
    footerY,
    width - 42,
    61
  );

  ctx.fillStyle = "#ffffff12";

  ctx.fillRect(
    21,
    footerY,
    width - 42,
    1
  );

  drawText(
    ctx,
    "AURA CHECK",
    contentX,
    footerY + 36,
    {
      size: 10,
      weight: 900,
      color: "#ffffff40",
      letterSpacing: 2,
    }
  );

  drawText(
    ctx,
    "aura.kodari.xyz",
    width - 55,
    footerY + 36,
    {
      size: 10,
      weight: 500,
      color: "#ffffff40",
      align: "right",
    }
  );

  return canvas;
};

export const FormAura = () => {
  const [username, setUsername] =
    useState("");

  const [profile, setProfile] =
    useState<AuraProfile | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [displayAura, setDisplayAura] =
    useState(0);

  const [downloading, setDownloading] =
    useState(false);

  const [sharing, setSharing] =
    useState(false);

  const [fromSharedLink, setFromSharedLink] =
    useState(false);

  const [qrCode, setQrCode] =
    useState<string | null>(null);

  /*
   * Cargar perfil desde URL.
   */
  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const sharedUsername =
      params.get("u");

    if (!sharedUsername) {
      return;
    }

    const clean =
      cleanUsername(sharedUsername);

    if (!clean) {
      return;
    }

    const result =
      calculateProfile(clean);

    setUsername(clean);
    setProfile(result);
    setFromSharedLink(true);
  }, []);

  /*
   * QR.
   */
  useEffect(() => {
    if (!profile) {
      setQrCode(null);
      return;
    }

    QRCode.toDataURL(
      getProfileUrl(
        profile.username
      ),
      {
        width: 280,
        margin: 2,
        color: {
          dark: "#ffffff",
          light: "#111318",
        },
      }
    )
      .then((value) => {
        setQrCode(value);
      })
      .catch((error) => {
        console.error(
          "No se pudo generar el QR:",
          error
        );
      });
  }, [profile]);

  /*
   * Animación del aura.
   */
  useEffect(() => {
    if (!profile) {
      return;
    }

    let start = 0;
    let frame = 0;

    const duration = 900;

    const animate = (
      timestamp: number
    ) => {
      if (!start) {
        start = timestamp;
      }

      const progress = Math.min(
        (timestamp - start) /
          duration,
        1
      );

      const eased =
        1 -
        Math.pow(
          1 - progress,
          4
        );

      setDisplayAura(
        Math.floor(
          profile.aura * eased
        )
      );

      if (progress < 1) {
        frame =
          requestAnimationFrame(
            animate
          );
      } else {
        setDisplayAura(
          profile.aura
        );
      }
    };

    frame =
      requestAnimationFrame(
        animate
      );

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [profile]);

  /*
   * Generar PNG.
   *
   * Ya NO usamos html2canvas.
   */
  const createImageBlob =
    async () => {
      if (!profile) {
        throw new Error(
          "No existe un perfil."
        );
      }

      const canvas =
        await createAuraCanvas(
          profile
        );

      return new Promise<Blob | null>(
        (resolve) => {
          canvas.toBlob(
            resolve,
            "image/png",
            1
          );
        }
      );
    };

  /*
   * Descargar.
   */
  const downloadImage = async () => {
    if (
      !profile ||
      downloading
    ) {
      return;
    }

    try {
      setDownloading(true);

      const blob =
        await createImageBlob();

      if (!blob) {
        throw new Error(
          "No se pudo generar el PNG."
        );
      }

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `aura-${profile.username}.png`;

      link.style.display = "none";

      document.body.appendChild(link);

      link.click();

      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error(
        "No se pudo descargar:",
        error
      );
    } finally {
      setDownloading(false);
    }
  };

  /*
   * Compartir.
   */
  const shareResult = async () => {
    if (
      !profile ||
      sharing
    ) {
      return;
    }

    try {
      setSharing(true);

      const blob =
        await createImageBlob();

      if (!blob) {
        throw new Error(
          "No se pudo generar el PNG."
        );
      }

      const file =
        new File(
          [blob],
          `aura-${profile.username}.png`,
          {
            type: "image/png",
          }
        );

      const shareUrl =
        getProfileUrl(
          profile.username
        );

      const shareText =
        `@${profile.username} tiene ${formatAura(
          profile.aura
        )} de aura 🗿 ¿Cuánto tenés vos?`;

      /*
       * Primero intentamos compartir
       * el archivo.
       */
      if (
        typeof navigator.share ===
          "function" &&
        typeof navigator.canShare ===
          "function" &&
        navigator.canShare({
          files: [file],
        })
      ) {
        await navigator.share({
          title: "Aura Check",
          text: shareText,
          url: shareUrl,
          files: [file],
        });

        return;
      }

      /*
       * Si el navegador no acepta archivos,
       * compartimos el enlace.
       */
      if (
        typeof navigator.share ===
        "function"
      ) {
        await navigator.share({
          title: "Aura Check",
          text: shareText,
          url: shareUrl,
        });

        return;
      }

      /*
       * Desktop fallback.
       */
      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `aura-${profile.username}.png`;

      link.style.display = "none";

      document.body.appendChild(link);

      link.click();

      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error(
        "No se pudo compartir:",
        error
      );
    } finally {
      setSharing(false);
    }
  };

  /*
   * Calcular aura.
   */
  const checkAura = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const clean =
      cleanUsername(username);

    if (
      !clean ||
      loading
    ) {
      return;
    }

    setFromSharedLink(false);
    setLoading(true);

    setTimeout(() => {
      const result =
        calculateProfile(clean);

      setUsername(clean);
      setProfile(result);
      setDisplayAura(0);
      setLoading(false);

      window.history.replaceState(
        {},
        "",
        `/?u=${encodeURIComponent(
          clean
        )}`
      );
    }, 650);
  };

  /*
   * Reset.
   */
  const reset = () => {
    setUsername("");
    setProfile(null);
    setDisplayAura(0);
    setFromSharedLink(false);
    setQrCode(null);

    window.history.replaceState(
      {},
      "",
      "/"
    );
  };

  const statItems = profile
    ? [
        ["ESTILO", profile.style],
        [
          "PRESENCIA",
          profile.presence,
        ],
        ["RAREZA", profile.rarity],
        ["IMPACTO", profile.impact],
      ]
    : [];

  return (
    <main className="relative min-h-[100svh] overflow-x-hidden bg-[#090a0e] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(88,101,242,0.12),transparent_30%),radial-gradient(circle_at_100%_100%,rgba(250,204,21,0.06),transparent_32%)]" />

      <section className="relative z-10 flex min-h-[100svh] items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[440px]">
          {!profile &&
            !loading && (
              <div>
                <div className="mb-8">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5865F2] text-sm font-black shadow-lg shadow-[#5865F2]/25">
                      A
                    </div>

                    <div>
                      <p className="text-sm font-bold text-white">
                        Aura Check
                      </p>

                      <p className="mt-0.5 text-[11px] text-white/40">
                        análisis de presencia
                      </p>
                    </div>
                  </div>

                  <h1 className="text-[32px] font-black leading-[1.05] tracking-[-0.04em] text-white">
                    ¿Cuánta aura
                    <span className="block text-[#facc15]">
                      tiene tu nombre?
                    </span>
                  </h1>

                  <p className="mt-4 max-w-[390px] text-sm leading-6 text-white/50">
                    Escribí tu usuario y
                    descubrí qué tanta
                    presencia tiene.
                  </p>
                </div>

                <form
                  onSubmit={checkAura}
                  className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#111318] shadow-2xl"
                >
                  <div className="flex items-center gap-3 border-b border-white/[0.08] bg-[#171920] px-5 py-4">
                    <span className="h-2 w-2 rounded-full bg-[#23a55a] shadow-[0_0_10px_rgba(35,165,90,0.5)]" />

                    <span className="text-[10px] font-bold tracking-[0.15em] text-white/45 uppercase">
                      ingresar usuario
                    </span>
                  </div>

                  <div className="p-5">
                    <label
                      htmlFor="username"
                      className="mb-2.5 block text-xs font-semibold text-white/60"
                    >
                      Tu nombre
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-white/35">
                        @
                      </span>

                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) =>
                          setUsername(
                            e.target.value
                          )
                        }
                        placeholder="maty.alvarez0k"
                        autoComplete="off"
                        className="w-full rounded-xl border border-white/[0.09] bg-[#0a0b0f] py-3.5 pl-9 pr-4 text-sm font-medium text-white outline-none transition placeholder:text-white/25 focus:border-[#5865F2]/70 focus:bg-[#0c0d12]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="mt-3.5 w-full rounded-xl bg-[#5865F2] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#4752c4] active:scale-[0.99]"
                    >
                      Ver mi aura
                    </button>
                  </div>
                </form>

                <p className="mt-5 text-center text-[11px] text-white/30">
                  Cada nombre tiene una
                  firma diferente.
                </p>
              </div>
            )}

          {loading && (
            <div className="flex min-h-[440px] flex-col items-center justify-center text-center">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#5865F2]/[0.08]">
                <div className="absolute inset-1 animate-spin rounded-full border-2 border-transparent border-t-[#facc15]" />

                <span className="text-xl font-black text-white">
                  A
                </span>
              </div>

              <p className="mt-7 text-[10px] font-bold tracking-[0.25em] text-[#facc15] uppercase">
                analizando
              </p>

              <p className="mt-2 text-sm text-white/45">
                @{username}
              </p>

              <p className="mt-7 text-xs text-white/30">
                calculando presencia...
              </p>
            </div>
          )}

          {profile &&
            !loading && (
              <div>
                {fromSharedLink && (
                  <div className="mb-4 rounded-xl border border-[#5865F2]/25 bg-[#5865F2]/[0.08] px-4 py-3.5 text-center">
                    <p className="text-[10px] font-black tracking-[0.15em] text-[#9da5ff] uppercase">
                      te desafiaron
                    </p>

                    <p className="mt-1 text-xs text-white/55">
                      Este es el resultado
                      de @{profile.username}
                    </p>
                  </div>
                )}

                {/* CARD VISUAL */}
                <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#111318] shadow-2xl">
                  <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] bg-[#171920] px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                        style={{
                          backgroundColor:
                            profile.accent,
                        }}
                      >
                        {getInitials(
                          profile.username
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">
                          @{profile.username}
                        </p>

                        <p className="mt-0.5 text-[10px] text-white/35">
                          resultado personal
                        </p>
                      </div>
                    </div>

                    <span
                      className="shrink-0 text-[9px] font-black tracking-[0.14em]"
                      style={{
                        color:
                          profile.accent,
                      }}
                    >
                      {profile.rank}
                    </span>
                  </div>

                  <div className="relative px-5 py-6 sm:px-6 sm:py-7">
                    <div className="relative">
                      <div className="flex items-end justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold tracking-[0.2em] text-white/35 uppercase">
                            nivel de aura
                          </p>

                          <div className="mt-2 flex items-end gap-2">
                            <span className="text-[52px] font-black leading-none tracking-[-0.06em] text-white sm:text-6xl">
                              {formatAura(
                                displayAura
                              )}
                            </span>

                            <span className="pb-1 text-[11px] text-white/35">
                              / 10.000
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p
                            className="text-xl font-black"
                            style={{
                              color:
                                profile.accent,
                            }}
                          >
                            {Math.round(
                              (profile.aura /
                                10000) *
                                100
                            )}
                            %
                          </p>

                          <p className="mt-1 text-[9px] font-medium text-white/30">
                            intensidad
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-[#252830]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${
                              (displayAura /
                                10000) *
                              100
                            }%`,
                            background:
                              "linear-gradient(90deg,#5865F2,#8b7cf6,#facc15)",
                          }}
                        />
                      </div>

                      <div className="mt-6 rounded-xl border border-white/[0.05] bg-[#191b21] px-4 py-4">
                        <p className="text-[15px] font-black leading-5 text-white sm:text-base">
                          {profile.message}
                        </p>

                        <p className="mt-2 text-[10px] font-medium text-white/35">
                          {profile.rank} · firma
                          de aura
                        </p>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2.5">
                        {statItems.map(
                          ([name, value]) => (
                            <div
                              key={name}
                              className="rounded-xl border border-white/[0.04] bg-[#191b21] px-3.5 py-3"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[8px] font-bold tracking-[0.12em] text-white/35">
                                  {name}
                                </p>

                                <p
                                  className="text-xs font-black"
                                  style={{
                                    color:
                                      profile.accent,
                                  }}
                                >
                                  {value}
                                </p>
                              </div>

                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#292c34]">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${value}%`,
                                    backgroundColor:
                                      profile.accent,
                                  }}
                                />
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/[0.07] bg-[#0e0f13] px-5 py-3">
                    <p className="text-[8px] font-black tracking-[0.2em] text-white/25">
                      AURA CHECK
                    </p>

                    <p className="text-[8px] font-medium text-white/25">
                      aura.kodari.xyz
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={shareResult}
                  disabled={sharing}
                  className="mt-4 w-full rounded-xl bg-[#5865F2] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#4752c4] active:scale-[0.99] disabled:opacity-50"
                >
                  {sharing
                    ? "Preparando resultado..."
                    : "📸 Compartir resultado"}
                </button>

                <button
                  type="button"
                  onClick={downloadImage}
                  disabled={downloading}
                  className="mt-2.5 w-full rounded-xl border border-white/[0.09] bg-[#111318] px-4 py-3.5 text-sm font-semibold text-white/65 transition hover:bg-[#171920] hover:text-white disabled:opacity-50"
                >
                  {downloading
                    ? "Preparando imagen..."
                    : "📥 Descargar imagen"}
                </button>

                <div className="mt-5 rounded-2xl border border-white/[0.08] bg-[#111318] p-5">
                  <div className="text-center">
                    <p className="text-sm font-bold text-white/75">
                      ¿Y vos?
                    </p>

                    <p className="mt-1.5 text-[11px] leading-5 text-white/40">
                      Compartí tu resultado
                      y hacé que tus amigos
                      descubran el suyo.
                    </p>
                  </div>

                  <div className="mt-5 flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold tracking-[0.12em] text-white/30 uppercase">
                        tu resultado
                      </p>

                      <p className="mt-1.5 truncate text-xs text-white/50">
                        aura.kodari.xyz/?u=
                        {profile.username}
                      </p>
                    </div>

                    {qrCode && (
                      <img
                        src={qrCode}
                        alt="Código QR del resultado"
                        className="h-[68px] w-[68px] shrink-0 rounded-lg"
                      />
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={reset}
                  className="mt-2 w-full py-3 text-xs font-medium text-white/30 transition hover:text-white/65"
                >
                  Probar otro nombre
                </button>
              </div>
            )}
        </div>
      </section>
    </main>
  );
};