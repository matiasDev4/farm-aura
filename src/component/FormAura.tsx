import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";

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
    .toLowerCase();
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
  const clean = username.toLowerCase();

  const letters =
    clean.match(/[a-z]/g) ?? [];

  const vowels =
    clean.match(/[aeiou]/g) ?? [];

  const consonants =
    clean.match(
      /[bcdfghjklmnpqrstvwxyz]/g
    ) ?? [];

  if (!letters.length) {
    return 5;
  }

  let quality = 70;

  const vowelRatio =
    vowels.length / letters.length;

  const consonantRatio =
    consonants.length / letters.length;

  const uniqueRatio =
    new Set(letters).size /
    Math.max(letters.length, 1);

  const keyboardSpam =
    /asdf|sdfg|dfgh|qwer|wert|zxcv|xcvb|qaz|wsx|edc|rfv/i.test(
      clean
    );

  const repeatedPattern =
    /^(.{1,3})\1{1,}$/i.test(clean);

  const repeatedLetters =
    /(.)\1{2,}/i.test(clean);

  const consonantCluster =
    /[bcdfghjklmnpqrstvwxyz]{3,}/i.test(
      clean
    );

  const veryBadConsonantCluster =
    /[bcdfghjklmnpqrstvwxyz]{4,}/i.test(
      clean
    );

  const rareLetters =
    clean.match(/[qxzjk]/g) ?? [];

  const startsWithBadCluster =
    /^[bcdfghjklmnpqrstvwxyz]{2,}/i.test(
      clean
    );

  const endsWithBadCluster =
    /[bcdfghjklmnpqrstvwxyz]{3,}$/i.test(
      clean
    );

  if (
    vowelRatio >= 0.25 &&
    vowelRatio <= 0.65
  ) {
    quality += 12;
  } else {
    quality -= 12;
  }

  if (uniqueRatio >= 0.75) {
    quality += 6;
  }

  if (uniqueRatio < 0.5) {
    quality -= 12;
  }

  if (keyboardSpam) {
    quality -= 45;
  }

  if (repeatedPattern) {
    quality -= 40;
  }

  if (repeatedLetters) {
    quality -= 12;
  }

  if (consonantCluster) {
    quality -= 20;
  }

  if (veryBadConsonantCluster) {
    quality -= 20;
  }

  if (rareLetters.length >= 2) {
    quality -= 18;
  }

  if (startsWithBadCluster) {
    quality -= 12;
  }

  if (endsWithBadCluster) {
    quality -= 12;
  }

  const half = Math.floor(
    clean.length / 2
  );

  if (
    clean.length >= 4 &&
    clean.slice(0, half) ===
      clean.slice(half, half * 2)
  ) {
    quality -= 35;
  }

  if (
    consonantRatio >= 0.75 &&
    letters.length >= 4
  ) {
    quality -= 25;
  }

  if (letters.length === 3) {
    if (vowelRatio >= 0.33) {
      quality += 8;
    } else {
      quality -= 18;
    }
  }

  if (
    letters.length >= 3 &&
    letters.length <= 8 &&
    vowelRatio >= 0.3 &&
    vowelRatio <= 0.6 &&
    uniqueRatio >= 0.65
  ) {
    quality += 10;
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
  const clean = username.toLowerCase();

  if (quality < 25) {
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

  if (quality < 40) {
    return "Tiene potencial, pero algo no termina de cerrar.";
  }

  if (clean.length === 1) {
    return "Una letra. Demasiada confianza.";
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

  if (
    clean.includes("x") &&
    clean.length <= 4
  ) {
    return "Corto, raro y bastante seguro.";
  }

  if (
    clean.includes("_") &&
    clean.length >= 8
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

  const letters =
    username.match(/[a-z]/gi) ?? [];

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
    1800 +
    quality * 58;

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
    aura += 350;
  }

  const variation =
    Math.round(
      randomFromSeed(seed, 777) *
        500
    ) - 250;

  aura += variation;

  if (
    numbers.length > 0 &&
    quality >= 65
  ) {
    aura += 120;
  }

  if (
    username.includes("_") &&
    quality >= 65
  ) {
    aura += 80;
  }

  if (quality < 25) {
    aura =
      900 +
      Math.round(
        randomFromSeed(seed, 123) *
          700
      );
  } else if (quality < 40) {
    aura =
      1700 +
      Math.round(
        randomFromSeed(seed, 234) *
          900
      );
  } else if (quality < 55) {
    aura =
      2800 +
      Math.round(
        randomFromSeed(seed, 345) *
          1000
      );
  }

  if (quality >= 88) {
    aura += 350;
  }

  if (quality >= 94) {
    aura += 450;
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

  const shareCardRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const previousHtmlOverflow =
      html.style.overflow;

    const previousBodyOverflow =
      body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow =
        previousHtmlOverflow;

      body.style.overflow =
        previousBodyOverflow;
    };
  }, []);

  const checkAura = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const clean =
      cleanUsername(username);

    if (!clean || loading) {
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const result =
        calculateProfile(clean);

      setUsername(clean);
      setProfile(result);
      setDisplayAura(0);
      setLoading(false);
    }, 650);
  };

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

  const downloadImage = async () => {
    if (
      !shareCardRef.current ||
      !profile ||
      downloading
    ) {
      return;
    }

    try {
      setDownloading(true);

      await new Promise((resolve) =>
        setTimeout(resolve, 100)
      );

      const canvas =
        await html2canvas(
          shareCardRef.current,
          {
            width: 1080,
            height: 1920,
            scale: 1,
            backgroundColor:
              "#0b0c10",
            logging: false,
            windowWidth: 1080,
            windowHeight: 1920,
          }
        );

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

  const reset = () => {
    setUsername("");
    setProfile(null);
    setDisplayAura(0);
  };

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[#0b0c10] text-white">

      <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_15%_0%,rgba(88,101,242,0.10),transparent_28%),radial-gradient(circle_at_100%_100%,rgba(250,204,21,0.05),transparent_30%)]" />

      <section
        className={`relative z-10 h-full w-full ${
          profile
            ? "overflow-y-auto overscroll-contain"
            : "overflow-hidden"
        }`}
      >

        <div
          className={`mx-auto flex w-full max-w-[430px] px-4 ${
            profile
              ? "min-h-full items-start py-6"
              : "h-full items-center"
          }`}
        >

          <div className="w-full">

            {!profile && !loading && (
              <div>

                <div className="mb-7">

                  <div className="mb-5 flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5865F2] text-sm font-black shadow-lg shadow-[#5865F2]/20">
                      A
                    </div>

                    <div>
                      <p className="text-sm font-bold">
                        Aura Check
                      </p>

                      <p className="text-[10px] text-white/25">
                        análisis de presencia
                      </p>
                    </div>

                  </div>

                  <h1 className="text-3xl font-black tracking-tight">
                    ¿Cuánta aura
                    <span className="block text-[#facc15]">
                      tiene tu nombre?
                    </span>
                  </h1>

                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/35">
                    Escribí tu usuario y
                    descubrí qué tanta
                    presencia tiene.
                  </p>

                </div>

                <form
                  onSubmit={checkAura}
                  className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#111318] shadow-2xl"
                >

                  <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#16181f] px-4 py-3">

                    <span className="h-2 w-2 rounded-full bg-[#23a55a]" />

                    <span className="text-[10px] font-bold tracking-[0.15em] text-white/30 uppercase">
                      ingresar usuario
                    </span>

                  </div>

                  <div className="p-4">

                    <label
                      htmlFor="username"
                      className="mb-2 block text-xs font-semibold text-white/45"
                    >
                      Tu nombre
                    </label>

                    <div className="relative">

                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/25">
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
                        className="w-full rounded-lg border border-white/[0.06] bg-[#0b0c10] py-3 pl-9 pr-4 text-sm outline-none transition placeholder:text-white/15 focus:border-[#5865F2]/60"
                      />

                    </div>

                    <button
                      type="submit"
                      className="mt-3 w-full rounded-lg bg-[#5865F2] px-4 py-3.5 text-sm font-bold transition hover:bg-[#4752c4] active:scale-[0.99]"
                    >
                      Ver mi aura
                    </button>

                  </div>

                </form>

                <p className="mt-4 text-center text-[10px] text-white/15">
                  Cada nombre tiene una
                  firma diferente.
                </p>

              </div>
            )}

            {loading && (
              <div className="flex h-full min-h-[100dvh] flex-col items-center justify-center text-center">

                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#5865F2]/[0.06]">

                  <div className="absolute inset-1 animate-spin rounded-full border-2 border-transparent border-t-[#facc15]" />

                  <span className="text-xl font-black">
                    A
                  </span>

                </div>

                <p className="mt-7 text-[10px] font-bold tracking-[0.25em] text-[#facc15] uppercase">
                  analizando
                </p>

                <p className="mt-2 text-sm text-white/25">
                  @{username}
                </p>

                <p className="mt-7 text-xs text-white/20">
                  calculando presencia...
                </p>

              </div>
            )}

            {profile && !loading && (
              <div className="w-full pb-6">

                <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#111318] shadow-2xl">

                  <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#16181f] px-4 py-3">

                    <div className="flex items-center gap-3">

                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-black"
                        style={{
                          backgroundColor:
                            profile.accent,
                        }}
                      >
                        {getInitials(
                          profile.username
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-bold">
                          @{profile.username}
                        </p>

                        <p className="text-[10px] text-white/25">
                          resultado personal
                        </p>
                      </div>

                    </div>

                    <span
                      className="text-[9px] font-black tracking-[0.14em]"
                      style={{
                        color:
                          profile.accent,
                      }}
                    >
                      {profile.rank}
                    </span>

                  </div>

                  <div className="relative px-5 py-6">

                    <div
                      className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-[90px]"
                      style={{
                        backgroundColor:
                          profile.accent,
                        opacity: 0.08,
                      }}
                    />

                    <div className="relative">

                      <div className="flex items-end justify-between">

                        <div>

                          <p className="text-[9px] font-bold tracking-[0.2em] text-white/25 uppercase">
                            nivel de aura
                          </p>

                          <div className="mt-1 flex items-end gap-3">

                            <span className="text-6xl font-black leading-none tracking-[-0.06em]">
                              {formatAura(
                                displayAura
                              )}
                            </span>

                            <span className="pb-1 text-xs text-white/20">
                              / 10.000
                            </span>

                          </div>

                        </div>

                        <div className="text-right">

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

                          <p className="text-[9px] text-white/20">
                            intensidad
                          </p>

                        </div>

                      </div>

                      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#20232a]">

                        <div
                          className="h-full rounded-full transition-all"
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

                      <div className="mt-5 rounded-lg bg-[#191b21] px-4 py-3.5">

                        <p className="text-base font-black text-white/80">
                          {profile.message}
                        </p>

                        <p className="mt-1 text-[10px] text-white/25">
                          {profile.rank} · firma
                          de aura
                        </p>

                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">

                        {[
                          [
                            "ESTILO",
                            profile.style,
                          ],
                          [
                            "PRESENCIA",
                            profile.presence,
                          ],
                          [
                            "RAREZA",
                            profile.rarity,
                          ],
                          [
                            "IMPACTO",
                            profile.impact,
                          ],
                        ].map(
                          ([name, value]) => (
                            <div
                              key={name}
                              className="rounded-lg bg-[#191b21] px-3 py-2.5"
                            >

                              <div className="flex items-center justify-between">

                                <p className="text-[8px] font-bold tracking-[0.12em] text-white/20">
                                  {name}
                                </p>

                                <p
                                  className="text-[11px] font-black"
                                  style={{
                                    color:
                                      profile.accent,
                                  }}
                                >
                                  {value}
                                </p>

                              </div>

                              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#292c34]">

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

                  <div className="flex items-center justify-between border-t border-white/[0.06] bg-[#0e0f13] px-4 py-2.5">

                    <p className="text-[8px] font-black tracking-[0.2em] text-white/15">
                      AURA CHECK
                    </p>

                    <p className="text-[8px] text-white/15">
                      resultado generado
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={downloadImage}
                  disabled={downloading}
                  className="mt-3 w-full rounded-lg bg-[#5865F2] px-4 py-3.5 text-sm font-bold transition hover:bg-[#4752c4] disabled:opacity-50"
                >
                  {downloading
                    ? "Preparando imagen..."
                    : "Descargar resultado"}
                </button>

                <button
                  type="button"
                  onClick={reset}
                  className="mt-1 w-full py-3 text-xs text-white/25 transition hover:text-white/60"
                >
                  Probar otro nombre
                </button>

              </div>
            )}

          </div>

        </div>

      </section>

      {profile && (
        <div
          ref={shareCardRef}
          style={{
            position: "fixed",
            left: "-2000px",
            top: "0",
            width: "1080px",
            height: "1920px",
            backgroundColor: "#0b0c10",
            color: "#fff",
            padding: "70px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "hidden",
            fontFamily:
              "Arial, Helvetica, sans-serif",
            pointerEvents: "none",
          }}
        >

          <div
            style={{
              position: "absolute",
              width: "700px",
              height: "700px",
              borderRadius: "50%",
              backgroundColor:
                profile.accent,
              opacity: 0.07,
              filter: "blur(160px)",
              top: "-300px",
              right: "-250px",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              padding:
                "25px 30px",
              borderRadius: "18px",
              backgroundColor:
                "#16181f",
              border:
                "1px solid rgba(255,255,255,0.07)",
            }}
          >

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >

              <div
                style={{
                  width: "58px",
                  height: "58px",
                  borderRadius: "15px",
                  backgroundColor:
                    profile.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  fontSize: "27px",
                  fontWeight: 900,
                }}
              >
                A
              </div>

              <div>

                <p
                  style={{
                    margin: 0,
                    fontSize: "27px",
                    fontWeight: 900,
                  }}
                >
                  Aura Check
                </p>

                <p
                  style={{
                    margin:
                      "4px 0 0",
                    fontSize: "15px",
                    color: "#666a72",
                  }}
                >
                  análisis de presencia
                </p>

              </div>

            </div>

            <p
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 900,
                letterSpacing: "2px",
                color:
                  profile.accent,
              }}
            >
              {profile.rank}
            </p>

          </div>

          <div
            style={{
              position: "relative",
              zIndex: 2,
              padding: "42px",
              borderRadius: "20px",
              backgroundColor:
                "#111318",
              border:
                "1px solid rgba(255,255,255,0.07)",
            }}
          >

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
              }}
            >

              <div
                style={{
                  width: "68px",
                  height: "68px",
                  borderRadius: "50%",
                  backgroundColor:
                    profile.accent,
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  fontSize: "22px",
                  fontWeight: 900,
                }}
              >
                {getInitials(
                  profile.username
                )}
              </div>

              <div>

                <p
                  style={{
                    margin: 0,
                    fontSize: "28px",
                    fontWeight: 900,
                  }}
                >
                  @{profile.username}
                </p>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    fontSize: "15px",
                    color: "#666a72",
                  }}
                >
                  firma de aura
                </p>

              </div>

            </div>

            <div
              style={{
                marginTop: "55px",
              }}
            >

              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: 900,
                  letterSpacing: "3px",
                  color: "#666a72",
                }}
              >
                NIVEL DE AURA
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "18px",
                }}
              >

                <p
                  style={{
                    margin:
                      "12px 0 0",
                    fontSize: "145px",
                    lineHeight: 0.9,
                    fontWeight: 900,
                    letterSpacing:
                      "-8px",
                  }}
                >
                  {formatAura(
                    profile.aura
                  )}
                </p>

                <p
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    color: "#555963",
                  }}
                >
                  / 10.000
                </p>

              </div>

              <p
                style={{
                  margin:
                    "18px 0 0",
                  fontSize: "38px",
                  fontWeight: 900,
                  letterSpacing: "4px",
                  color:
                    profile.accent,
                }}
              >
                AURA
              </p>

            </div>

            <div
              style={{
                marginTop: "45px",
              }}
            >

              <div
                style={{
                  width: "100%",
                  height: "12px",
                  borderRadius:
                    "999px",
                  backgroundColor:
                    "#24262d",
                  overflow: "hidden",
                }}
              >

                <div
                  style={{
                    width: `${
                      (profile.aura /
                        10000) *
                      100
                    }%`,
                    height: "100%",
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
                  marginTop: "12px",
                  fontSize: "14px",
                  color: "#555963",
                }}
              >

                <span>0</span>

                <span
                  style={{
                    color:
                      profile.accent,
                    fontWeight: 900,
                  }}
                >
                  {Math.round(
                    (profile.aura /
                      10000) *
                      100
                  )}
                  %
                </span>

                <span>
                  10.000
                </span>

              </div>

            </div>

            <div
              style={{
                marginTop: "40px",
                padding: "23px",
                borderRadius: "13px",
                backgroundColor:
                  "#191b21",
              }}
            >

              <p
                style={{
                  margin: 0,
                  fontSize: "27px",
                  fontWeight: 900,
                }}
              >
                {profile.message}
              </p>

              <p
                style={{
                  margin:
                    "7px 0 0",
                  fontSize: "14px",
                  color: "#666a72",
                }}
              >
                {profile.rank} · firma
                de aura
              </p>

            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "10px",
                marginTop: "10px",
              }}
            >

              {[
                [
                  "ESTILO",
                  profile.style,
                ],
                [
                  "PRESENCIA",
                  profile.presence,
                ],
                [
                  "RAREZA",
                  profile.rarity,
                ],
                [
                  "IMPACTO",
                  profile.impact,
                ],
              ].map(
                ([name, value]) => (
                  <div
                    key={name}
                    style={{
                      padding:
                        "18px",
                      borderRadius:
                        "11px",
                      backgroundColor:
                        "#191b21",
                    }}
                  >

                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                      }}
                    >

                      <p
                        style={{
                          margin: 0,
                          fontSize:
                            "11px",
                          fontWeight: 900,
                          letterSpacing:
                            "1.5px",
                          color:
                            "#555963",
                        }}
                      >
                        {name}
                      </p>

                      <p
                        style={{
                          margin: 0,
                          fontSize:
                            "14px",
                          fontWeight: 900,
                          color:
                            profile.accent,
                        }}
                      >
                        {value}
                      </p>

                    </div>

                    <div
                      style={{
                        marginTop:
                          "9px",
                        height:
                          "5px",
                        borderRadius:
                          "999px",
                        backgroundColor:
                          "#292c34",
                        overflow:
                          "hidden",
                      }}
                    >

                      <div
                        style={{
                          width: `${value}%`,
                          height:
                            "100%",
                          borderRadius:
                            "999px",
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

          <div
            style={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              padding:
                "20px 25px",
              borderTop:
                "1px solid rgba(255,255,255,0.06)",
            }}
          >

            <p
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: 900,
                letterSpacing:
                  "3px",
                color:
                  "#3d4047",
              }}
            >
              AURA CHECK
            </p>

            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color:
                  "#3d4047",
              }}
            >
              resultado personal
            </p>

          </div>

        </div>
      )}

    </main>
  );
};
