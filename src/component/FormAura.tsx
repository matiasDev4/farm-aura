import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
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

  const shareCardRef =
    useRef<HTMLDivElement>(null);

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
      cleanUsername(
        sharedUsername
      );

    if (!clean) {
      return;
    }

    const result =
      calculateProfile(clean);

    setUsername(clean);
    setProfile(result);
    setFromSharedLink(true);
  }, []);

  useEffect(() => {
    if (!profile) {
      setQrCode(null);
      return;
    }

    const url =
      getProfileUrl(
        profile.username
      );

    QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: {
        dark: "#ffffff",
        light: "#111318",
      },
    })
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

  const createCanvas = async () => {
    if (!shareCardRef.current) {
      return null;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 200)
    );

    return html2canvas(
      shareCardRef.current,
      {
        width: 1080,
        height: 1920,
        scale: 1,
        backgroundColor: "#090a0e",
        logging: false,
        useCORS: true,
        allowTaint: false,
      }
    );
  };

  const downloadImage = async () => {
    if (
      !profile ||
      downloading
    ) {
      return;
    }

    try {
      setDownloading(true);

      const canvas =
        await createCanvas();

      if (!canvas) {
        return;
      }

      const dataUrl =
        canvas.toDataURL(
          "image/png"
        );

      const link =
        document.createElement("a");

      link.href = dataUrl;
      link.download =
        `aura-${profile.username}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(
        "No se pudo generar la imagen:",
        error
      );
    } finally {
      setDownloading(false);
    }
  };

  const shareResult = async () => {
    if (
      !profile ||
      sharing
    ) {
      return;
    }

    try {
      setSharing(true);

      const canvas =
        await createCanvas();

      if (!canvas) {
        return;
      }

      const blob =
        await new Promise<Blob | null>(
          (resolve) =>
            canvas.toBlob(
              resolve,
              "image/png"
            )
        );

      if (!blob) {
        return;
      }

      const file =
        new File(
          [
            blob,
          ],
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

      if (
        navigator.share &&
        navigator.canShare &&
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

      if (navigator.share) {
        await navigator.share({
          title: "Aura Check",
          text: shareText,
          url: shareUrl,
        });

        return;
      }

      const link =
        document.createElement("a");

      link.href =
        URL.createObjectURL(blob);

      link.download =
        `aura-${profile.username}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(
        link.href
      );
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
        ["PRESENCIA", profile.presence],
        ["RAREZA", profile.rarity],
        ["IMPACTO", profile.impact],
      ]
    : [];

  return (
    <main className="relative min-h-[100svh] overflow-x-hidden bg-[#090a0e] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(88,101,242,0.12),transparent_30%),radial-gradient(circle_at_100%_100%,rgba(250,204,21,0.06),transparent_32%)]" />

      <section className="relative z-10 flex min-h-[100svh] items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[440px]">
          {!profile && !loading && (
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

          {profile && !loading && (
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
                  <div
                    className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-[90px]"
                    style={{
                      backgroundColor:
                        profile.accent,
                      opacity: 0.1,
                    }}
                  />

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

      {profile && (
        <div
          ref={shareCardRef}
          style={{
            position: "fixed",
            left: "-3000px",
            top: "0",
            width: "1080px",
            height: "1920px",
            boxSizing: "border-box",
            background: "#090a0e",
            color: "#fff",
            padding: "64px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily:
              "Arial, Helvetica, sans-serif",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "760px",
              height: "760px",
              borderRadius: "50%",
              background:
                profile.accent,
              opacity: 0.08,
              filter: "blur(160px)",
              top: "-360px",
              right: "-260px",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: "620px",
              height: "620px",
              borderRadius: "50%",
              background: "#5865F2",
              opacity: 0.04,
              filter: "blur(150px)",
              bottom: "-300px",
              left: "-260px",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 2,
              width: "100%",
              height: "118px",
              minHeight: "118px",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 30px",
              borderRadius: "22px",
              background: "#16181f",
              border:
                "1px solid rgba(255,255,255,0.09)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: "100%",
                gap: "18px",
              }}
            >
              <div
                style={{
                  width: "62px",
                  height: "62px",
                  minWidth: "62px",
                  borderRadius: "17px",
                  background:
                    profile.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  fontSize: "29px",
                  lineHeight: "62px",
                  fontWeight: 900,
                  color: "#fff",
                }}
              >
                A
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection:
                    "column",
                  justifyContent:
                    "center",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "28px",
                    lineHeight: "32px",
                    fontWeight: 900,
                    color: "#fff",
                  }}
                >
                  Aura Check
                </p>

                <p
                  style={{
                    margin: "7px 0 0",
                    fontSize: "15px",
                    lineHeight: "19px",
                    fontWeight: 600,
                    color: "#9da1aa",
                  }}
                >
                  análisis de presencia
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
                height: "40px",
                padding: "0 17px",
                borderRadius: "999px",
                background:
                  "rgba(255,255,255,0.045)",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "13px",
                  lineHeight: "16px",
                  fontWeight: 900,
                  letterSpacing: "2px",
                  color:
                    profile.accent,
                }}
              >
                {profile.rank}
              </span>
            </div>
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 2,
              width: "100%",
              height: "1450px",
              minHeight: "1450px",
              marginTop: "34px",
              boxSizing: "border-box",
              padding: "44px",
              borderRadius: "26px",
              background: "#111318",
              border:
                "1px solid rgba(255,255,255,0.09)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                height: "88px",
              }}
            >
              <div
                style={{
                  width: "82px",
                  height: "82px",
                  minWidth: "82px",
                  borderRadius: "50%",
                  background:
                    profile.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  fontSize: "26px",
                  lineHeight: "82px",
                  fontWeight: 900,
                  color: "#fff",
                }}
              >
                {getInitials(
                  profile.username
                )}
              </div>

              <div
                style={{
                  marginLeft: "20px",
                  minWidth: 0,
                  maxWidth: "700px",
                  display: "flex",
                  flexDirection:
                    "column",
                  justifyContent:
                    "center",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "32px",
                    lineHeight: "38px",
                    fontWeight: 900,
                    color: "#fff",
                    whiteSpace:
                      "nowrap",
                    overflow: "hidden",
                    textOverflow:
                      "ellipsis",
                  }}
                >
                  @{profile.username}
                </p>

                <p
                  style={{
                    margin: "7px 0 0",
                    fontSize: "15px",
                    lineHeight: "20px",
                    fontWeight: 600,
                    color: "#8f939c",
                  }}
                >
                  firma de aura
                </p>
              </div>
            </div>

            <div
              style={{
                marginTop: "62px",
                width: "100%",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  lineHeight: "18px",
                  fontWeight: 900,
                  letterSpacing: "3px",
                  color: "#8f939c",
                }}
              >
                NIVEL DE AURA
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems:
                    "flex-end",
                  width: "100%",
                  marginTop: "12px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "126px",
                    lineHeight: "126px",
                    fontWeight: 900,
                    letterSpacing:
                      "-6px",
                    color: "#fff",
                  }}
                >
                  {formatAura(
                    profile.aura
                  )}
                </p>

                <p
                  style={{
                    margin:
                      "0 0 10px 20px",
                    fontSize: "20px",
                    lineHeight: "24px",
                    fontWeight: 600,
                    color: "#727680",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  / 10.000
                </p>
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  height: "38px",
                  marginTop: "18px",
                  padding: "0 15px",
                  borderRadius:
                    "999px",
                  background:
                    "rgba(255,255,255,0.04)",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    lineHeight:
                      "18px",
                    fontWeight: 900,
                    letterSpacing:
                      "2px",
                    color:
                      profile.accent,
                  }}
                >
                  {Math.round(
                    (profile.aura /
                      10000) *
                      100
                  )}
                  % INTENSIDAD
                </span>
              </div>
            </div>

            <div
              style={{
                width: "100%",
                marginTop: "48px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "14px",
                  borderRadius:
                    "999px",
                  background:
                    "#292c34",
                  overflow:
                    "hidden",
                }}
              >
                <div
                  style={{
                    width: `${
                      (profile.aura /
                        10000) *
                      100
                    }%`,
                    height: "14px",
                    borderRadius:
                      "999px",
                    background:
                      "linear-gradient(90deg,#5865F2,#8b7cf6,#facc15)",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  marginTop: "11px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    lineHeight:
                      "17px",
                    fontWeight: 600,
                    color: "#737781",
                  }}
                >
                  0
                </span>

                <span
                  style={{
                    fontSize: "13px",
                    lineHeight:
                      "17px",
                    fontWeight: 600,
                    color: "#737781",
                  }}
                >
                  10.000
                </span>
              </div>
            </div>

            <div
              style={{
                width: "100%",
                minHeight: "150px",
                marginTop: "44px",
                padding:
                  "25px 28px",
                boxSizing:
                  "border-box",
                borderRadius:
                  "17px",
                background:
                  "#191b21",
                border:
                  "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                flexDirection:
                  "column",
                justifyContent:
                  "center",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "27px",
                  lineHeight: "35px",
                  fontWeight: 900,
                  color: "#fff",
                  overflowWrap:
                    "break-word",
                  wordBreak:
                    "normal",
                }}
              >
                {profile.message}
              </p>

              <p
                style={{
                  margin:
                    "10px 0 0",
                  fontSize: "14px",
                  lineHeight:
                    "18px",
                  fontWeight: 600,
                  color: "#8f939c",
                }}
              >
                {profile.rank} · firma de aura
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                columnGap:
                  "14px",
                rowGap: "14px",
                width: "100%",
                marginTop: "14px",
              }}
            >
              {statItems.map(
                ([name, value]) => (
                  <div
                    key={name}
                    style={{
                      height: "112px",
                      boxSizing:
                        "border-box",
                      padding:
                        "18px 20px",
                      borderRadius:
                        "15px",
                      background:
                        "#191b21",
                      border:
                        "1px solid rgba(255,255,255,0.04)",
                      display: "flex",
                      flexDirection:
                        "column",
                      justifyContent:
                        "center",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        width:
                          "100%",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize:
                            "11px",
                          lineHeight:
                            "14px",
                          fontWeight:
                            900,
                          letterSpacing:
                            "1.5px",
                          color:
                            "#858992",
                        }}
                      >
                        {name}
                      </p>

                      <p
                        style={{
                          margin: 0,
                          fontSize:
                            "17px",
                          lineHeight:
                            "21px",
                          fontWeight:
                            900,
                          color:
                            profile.accent,
                        }}
                      >
                        {value}
                      </p>
                    </div>

                    <div
                      style={{
                        width:
                          "100%",
                        height:
                          "6px",
                        marginTop:
                          "11px",
                        borderRadius:
                          "999px",
                        background:
                          "#2b2e36",
                        overflow:
                          "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${value}%`,
                          height:
                            "6px",
                          borderRadius:
                            "999px",
                          background:
                            profile.accent,
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>

            <div
              style={{
                position:
                  "absolute",
                left: "44px",
                right: "44px",
                bottom: "42px",
                height: "230px",
                boxSizing:
                  "border-box",
                padding: "28px",
                borderRadius:
                  "18px",
                background:
                  "linear-gradient(135deg,rgba(88,101,242,0.08),rgba(250,204,21,0.025))",
                border:
                  "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
              }}
            >
              <div
                style={{
                  width: "620px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    lineHeight:
                      "18px",
                    fontWeight: 900,
                    letterSpacing:
                      "2px",
                    color: "#737781",
                  }}
                >
                  ¿CUÁNTA AURA TENÉS?
                </p>

                <p
                  style={{
                    margin:
                      "10px 0 0",
                    fontSize: "22px",
                    lineHeight:
                      "30px",
                    fontWeight: 900,
                    color: "#fff",
                  }}
                >
                  Probá tu nombre y descubrí tu nivel.
                </p>

                <p
                  style={{
                    margin:
                      "8px 0 0",
                    fontSize: "14px",
                    lineHeight:
                      "19px",
                    fontWeight: 600,
                    color: "#70747d",
                  }}
                >
                  aura.kodari.xyz
                </p>
              </div>

              {qrCode && (
                <div
                  style={{
                    width: "150px",
                    height: "150px",
                    padding: "12px",
                    boxSizing:
                      "border-box",
                    borderRadius:
                      "15px",
                    background:
                      "#fff",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                  }}
                >
                  <img
                    src={qrCode}
                    alt=""
                    width={126}
                    height={126}
                    style={{
                      display:
                        "block",
                      width:
                        "126px",
                      height:
                        "126px",
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 2,
              width: "100%",
              height: "120px",
              minHeight: "120px",
              marginTop: "28px",
              boxSizing:
                "border-box",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              padding: "0 10px",
              borderTop:
                "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "15px",
                  lineHeight:
                    "20px",
                  fontWeight: 900,
                  letterSpacing:
                    "3px",
                  color: "#6e727b",
                }}
              >
                AURA CHECK
              </p>

              <p
                style={{
                  margin:
                    "7px 0 0",
                  fontSize: "13px",
                  lineHeight:
                    "18px",
                  fontWeight: 600,
                  color: "#555963",
                }}
              >
                aura.kodari.xyz
              </p>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: "13px",
                lineHeight:
                  "18px",
                fontWeight: 600,
                color: "#555963",
              }}
            >
              Tu nombre. Tu aura.
            </p>
          </div>
        </div>
      )}
    </main>
  );
};
