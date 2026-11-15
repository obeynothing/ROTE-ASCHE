import { useCallback, useEffect, useState } from 'react';
import type { ControlLabels } from '../game/controls';
import { WEAPON_ORDER, WEAPONS } from '../game/physics';
import { GAME_EDITION, GAME_VERSION } from '../game/version';
import type { MenuInputSubscriber } from '../hooks/useMenuNavigation';
import { InputPrompt } from './InputPrompt';

interface GuideModalProps {
  open: boolean;
  controls: ControlLabels;
  onClose: () => void;
  subscribeMenuInput: MenuInputSubscriber;
}

type GuideTab = 'enemies' | 'combat';

interface EnemyBestiaryEntry {
  id: string;
  name: string;
  hp: string;
  threat: string;
  behavior: string;
  counter: string;
}

const ENEMY_BESTIARY: EnemyBestiaryEntry[] = [
  {
    id: 'patrol_drone',
    name: 'Patrouillen-Drohne',
    hp: '2 HP',
    threat: 'Sektor 01+',
    behavior: 'Schwebt auf festen Flugbahnen und blockiert Sprungkorridore.',
    counter: 'Mit Puls oder Krons Ramm-Dash direkt zerschmettern.',
  },
  {
    id: 'saw_slider',
    name: 'Kreissäge',
    hp: 'Unzerstörbar',
    threat: 'Falle',
    behavior: 'Rast unablässig über gesicherte Stahlschienen. Schüsse prallen ab.',
    counter: 'Rhythmus abpassen, hoch überspringen oder per Dash durchschlüpfen.',
  },
  {
    id: 'pulse_turret',
    name: 'Puls-Turm',
    hp: '3 HP',
    threat: 'Decke',
    behavior: 'Zielt kurz mit blinkendem Warnstrahl nach unten und feuert einen Rot-Laser.',
    counter: 'Zwischen den Salven zerstören oder beim Telegraph zur Seite dashen.',
  },
  {
    id: 'stalker_crawler',
    name: 'Pirsch-Bestie',
    hp: '3 HP',
    threat: 'Bio-Jäger',
    behavior: 'Duckt sich bei Sichtkontakt (weißes Aufblitzen) und stürmt blitzschnell los.',
    counter: 'Über den Ansturm springen oder mit der Schrot-Salve im Nahkampf stoppen.',
  },
  {
    id: 'mortar_spitter',
    name: 'Spuck-Mörser',
    hp: '4 HP',
    threat: 'Artillerie',
    behavior: 'Pumpt sich auf und schleudert ballistische Blut-Sporen in hohem Bogen.',
    counter: 'Nicht stehen bleiben – aus sicherer Deckung mit Mörser oder Puls erledigen.',
  },
  {
    id: 'shield_enforcer',
    name: 'Schild-Vollstrecker',
    hp: '4 HP',
    threat: 'Gepanzert',
    behavior: 'Blockt frontale Puls- und Schrot-Treffer mit weißem Schild und feuert Bolzen.',
    counter: 'Die Harpune durchschlägt das Schild frontal! Alternativ Mörser oder Rücken.',
  },
  {
    id: 'hunter_wasp',
    name: 'Jäger-Wespe',
    hp: '2 HP',
    threat: 'Luft-Sucher',
    behavior: 'Kreist hoch in der Luft und stürzt sich diagonal auf den aktiven Läufer.',
    counter: 'Früh beim Schweben mit Puls oder Schrot vom Himmel holen.',
  },
  {
    id: 'omega_kolos',
    name: 'OMEGA-KOLOS · Fleischkern',
    hp: '90 HP · 3 Phasen',
    threat: 'Endboss · Sektor 14',
    behavior:
      'Schlägt Tentakel auf markierte Boden-Zonen, feuert Sporen-Salven, ruft Brut-Minions (ab Phase 2) und stürmt durch die Kammer.',
    counter:
      'Obere Katwalks nutzen, roten Boden-Markierungen ausweichen und mit Harpune oder Mörser den Kern brechen.',
  },
];

function EnemyPixelPortrait({ id }: { id: string }) {
  switch (id) {
    case 'patrol_drone':
      return (
        <svg viewBox="0 0 36 28" className="w-12 h-9 shrink-0" aria-hidden="true">
          <rect x="6" y="3" width="24" height="2" fill="#F4F4F5" />
          <rect x="4" y="8" width="28" height="14" rx="2" fill="#27272A" stroke="#E4E4E7" strokeWidth="1.5" />
          <rect x="8" y="12" width="20" height="7" fill="#09090B" />
          <rect x="21" y="13" width="6" height="4" fill="#EF4444" />
          <rect x="24" y="14" width="2" height="2" fill="#FFFFFF" />
        </svg>
      );
    case 'saw_slider':
      return (
        <svg viewBox="0 0 36 28" className="w-12 h-9 shrink-0" aria-hidden="true">
          <rect x="2" y="13" width="32" height="3" fill="#52525B" />
          <rect x="11" y="7" width="14" height="14" rx="2" fill="#F4F4F5" />
          <rect x="8" y="12" width="20" height="4" fill="#DC2626" />
          <rect x="16" y="4" width="4" height="20" fill="#DC2626" />
          <rect x="15" y="11" width="6" height="6" fill="#09090B" />
        </svg>
      );
    case 'pulse_turret':
      return (
        <svg viewBox="0 0 36 28" className="w-12 h-9 shrink-0" aria-hidden="true">
          <rect x="8" y="2" width="20" height="11" rx="2" fill="#18181B" stroke="#E4E4E7" strokeWidth="1.5" />
          <rect x="14" y="12" width="8" height="4" fill="#71717A" />
          <rect x="15" y="16" width="6" height="11" fill="#991B1B" />
          <rect x="17" y="16" width="2" height="11" fill="#FFFFFF" />
        </svg>
      );
    case 'stalker_crawler':
      return (
        <svg viewBox="0 0 36 28" className="w-12 h-9 shrink-0" aria-hidden="true">
          <rect x="10" y="6" width="4" height="4" fill="#F4F4F5" />
          <rect x="17" y="6" width="4" height="4" fill="#F4F4F5" />
          <rect x="5" y="10" width="25" height="11" rx="2" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.5" />
          <rect x="23" y="13" width="6" height="3" fill="#FFFFFF" />
          <rect x="7" y="21" width="4" height="5" fill="#450A0A" />
          <rect x="24" y="21" width="4" height="5" fill="#450A0A" />
        </svg>
      );
    case 'mortar_spitter':
      return (
        <svg viewBox="0 0 36 28" className="w-12 h-9 shrink-0" aria-hidden="true">
          <rect x="5" y="17" width="26" height="9" rx="2" fill="#450A0A" />
          <rect x="8" y="9" width="20" height="15" rx="3" fill="#DC2626" />
          <rect x="12" y="6" width="12" height="5" fill="#09090B" />
          <circle cx="18" cy="5" r="2.5" fill="#EF4444" />
        </svg>
      );
    case 'shield_enforcer':
      return (
        <svg viewBox="0 0 36 28" className="w-12 h-9 shrink-0" aria-hidden="true">
          <rect x="7" y="6" width="14" height="19" rx="2" fill="#18181D" stroke="#E4E4E7" strokeWidth="1.2" />
          <rect x="15" y="9" width="6" height="3" fill="#EF4444" />
          <rect x="23" y="4" width="5" height="22" rx="1" fill="#FFFFFF" />
          <rect x="23" y="10" width="5" height="6" fill="#DC2626" />
        </svg>
      );
    case 'hunter_wasp':
      return (
        <svg viewBox="0 0 36 28" className="w-12 h-9 shrink-0" aria-hidden="true">
          <rect x="9" y="5" width="18" height="4" rx="1" fill="#F4F4F5" />
          <rect x="7" y="10" width="22" height="11" rx="3" fill="#18181D" stroke="#DC2626" strokeWidth="1.5" />
          <rect x="10" y="12" width="16" height="7" rx="2" fill="#DC2626" />
          <rect x="23" y="14" width="4" height="3" fill="#FFFFFF" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 36 28" className="w-12 h-9 shrink-0" aria-hidden="true">
          {/* Writhing multi-jointed tendrils + white bone barbs */}
          <path d="M4 25 Q7 17 12 16" stroke="#450A0A" strokeWidth="4" fill="none" />
          <path d="M4 25 Q7 17 12 16" stroke="#DC2626" strokeWidth="2" fill="none" />
          <rect x="2" y="23" width="3" height="3" fill="#F4F4F5" />
          <path d="M32 25 Q29 17 24 16" stroke="#450A0A" strokeWidth="4" fill="none" />
          <path d="M32 25 Q29 17 24 16" stroke="#DC2626" strokeWidth="2" fill="none" />
          <rect x="31" y="23" width="3" height="3" fill="#F4F4F5" />
          <path d="M7 6 Q11 9 13 11" stroke="#991B1B" strokeWidth="2.5" fill="none" />
          <path d="M29 6 Q25 9 23 11" stroke="#991B1B" strokeWidth="2.5" fill="none" />
          {/* Asymmetric organic flesh core + shattered bone rib plates */}
          <rect x="9" y="5" width="18" height="17" rx="4" fill="#450A0A" />
          <rect x="10" y="6" width="16" height="15" rx="3" fill="#991B1B" />
          <rect x="12" y="7" width="12" height="12" rx="2" fill="#DC2626" />
          <rect x="8" y="8" width="3" height="10" fill="#E4E4E7" />
          <rect x="25" y="8" width="3" height="10" fill="#E4E4E7" />
          <rect x="13" y="3" width="10" height="3" fill="#F4F4F5" />
          {/* Asymmetric Carrion Eye Cluster */}
          <rect x="12" y="8" width="3" height="3" fill="#050506" />
          <rect x="13" y="9" width="2" height="2" fill="#FFFFFF" />
          <rect x="17" y="7" width="3" height="3" fill="#050506" />
          <rect x="18" y="8" width="2" height="2" fill="#EF4444" />
          <rect x="21" y="9" width="3" height="3" fill="#050506" />
          <rect x="21" y="10" width="2" height="1" fill="#FFFFFF" />
          {/* Jagged glowing inner maw */}
          <rect x="13" y="13" width="10" height="6" fill="#050506" />
          <rect x="15" y="15" width="6" height="2" fill="#EF4444" />
          <rect x="14" y="13" width="2" height="2" fill="#FFFFFF" />
          <rect x="20" y="13" width="2" height="2" fill="#FFFFFF" />
          <rect x="17" y="17" width="2" height="2" fill="#FFFFFF" />
        </svg>
      );
  }
}

export function GuideModal({ open, controls, onClose, subscribeMenuInput }: GuideModalProps) {
  const [tab, setTab] = useState<GuideTab>('enemies');

  const handleToggleTab = useCallback(() => {
    setTab((prev) => (prev === 'enemies' ? 'combat' : 'enemies'));
  }, []);

  useEffect(() => {
    if (!open) return;
    return subscribeMenuInput((m) => {
      if (m.left || m.right) {
        handleToggleTab();
        return;
      }
      if (m.back || m.confirm) {
        onClose();
      }
    });
  }, [open, subscribeMenuInput, handleToggleTab, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#030304]/90">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-dialog-title"
        className="w-full max-w-5xl rounded-2xl bg-[#09090B] border border-zinc-700 crimson-edge-glow p-5 sm:p-6 text-zinc-100 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-3 border-b border-zinc-800 pb-3">
          <div>
            <h2
              id="guide-dialog-title"
              className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-wider text-white"
            >
              Anleitung &amp; Gegner-Bestiarium
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Taktik, Squad-Fähigkeiten, 4 Waffen &amp; alle Gefahren der Bio-Seuchen-Kammer.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Anleitung schließen"
            className="px-4 py-2 rounded-xl flex items-center gap-2 bg-[#18181B] hover:bg-[#DC2626] border border-white text-xs font-bold uppercase tracking-wider text-white cursor-pointer transition-colors"
          >
            <span>Schließen</span>
            <InputPrompt label={controls.back} mode={controls.mode} tone="inverted" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setTab('enemies')}
            className={`px-4 py-1.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
              tab === 'enemies'
                ? 'bg-[#DC2626] text-white border-white'
                : 'bg-[#050506] text-zinc-300 border-zinc-800 hover:border-zinc-600'
            }`}
          >
            Gegner &amp; Endboss (8)
          </button>
          <button
            type="button"
            onClick={() => setTab('combat')}
            className={`px-4 py-1.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
              tab === 'combat'
                ? 'bg-[#DC2626] text-white border-white'
                : 'bg-[#050506] text-zinc-300 border-zinc-800 hover:border-zinc-600'
            }`}
          >
            Squad, Waffen &amp; Steuerung
          </button>
          <span className="ml-auto text-[11px] font-mono-num text-zinc-400 hidden sm:inline-flex items-center gap-1.5">
            <InputPrompt label={controls.mode === 'xbox' ? 'D-PAD' : controls.navHorizontal} mode={controls.mode} />
            <span>Reiter wechseln</span>
          </span>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 pr-1">
          {tab === 'enemies' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {ENEMY_BESTIARY.map((enemy) => {
                const isBoss = enemy.id === 'omega_kolos';
                return (
                  <div
                    key={enemy.id}
                    className={`p-2.5 sm:p-3 rounded-xl border flex items-start gap-3 ${
                      isBoss
                        ? 'md:col-span-2 bg-[#160608] border-[#991B1B]'
                        : 'bg-[#050506] border-zinc-800'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-[#09090B] border border-zinc-800 shrink-0">
                      <EnemyPixelPortrait id={enemy.id} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-0.5">
                        <h3
                          className={`font-display font-bold uppercase tracking-wider text-sm sm:text-base ${
                            isBoss ? 'text-[#EF4444]' : 'text-white'
                          }`}
                        >
                          {enemy.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono-num uppercase">
                          <span className="px-1.5 py-0.5 rounded-md bg-[#18181B] border border-zinc-700 text-zinc-200">
                            {enemy.hp}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-[#180808] border border-[#7F1D1D] text-[#EF4444]">
                            {enemy.threat}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] sm:text-xs text-zinc-300 leading-snug mb-1">{enemy.behavior}</p>
                      <p className="text-[11px] sm:text-xs text-zinc-400 leading-snug">
                        <strong className="text-[#EF4444]">Konter:</strong> {enemy.counter}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Squad & DKC Buddy Mechanic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-[#050506] border border-zinc-800">
                  <div className="text-xs font-mono-num uppercase tracking-wider text-[#EF4444] mb-1">
                    Läufer 01 · Agilität
                  </div>
                  <h3 className="text-lg font-display font-bold uppercase tracking-wider text-white mb-1.5">
                    ASCHE (Dreifach-Sprung)
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Maximales Lauftempo, zwei zusätzliche Luftsprünge und kürzester Dash-Cooldown. Ideal für hohe Schächte,
                    Wandsprünge und präzises Ausweichen.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#050506] border border-zinc-800">
                  <div className="text-xs font-mono-num uppercase tracking-wider text-zinc-300 mb-1">
                    Läufer 02 · Schwere Rüstung
                  </div>
                  <h3 className="text-lg font-display font-bold uppercase tracking-wider text-[#EF4444] mb-1.5">
                    KRON (Gleiter &amp; Ramm-Dash)
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Hält <InputPrompt label={controls.jump} mode={controls.mode} className="mx-0.5 align-middle" /> in der Luft zum Gleiten,
                    verursacht <strong className="text-white">+1 Bonusschaden</strong> und zerschmettert Gegner beim Ramm-Dash (<InputPrompt label={controls.dash} mode={controls.mode} className="mx-0.5 align-middle" />) ohne Schaden.
                  </p>
                </div>
              </div>

              {/* Extra Life Rule */}
              <div className="p-3.5 rounded-xl bg-[#160608] border border-[#7F1D1D] text-xs text-zinc-200 leading-relaxed">
                <strong className="text-[#EF4444] uppercase tracking-wider mr-1.5">Tag-Team Extra-Leben:</strong>
                Wechsle jederzeit mit <InputPrompt label={controls.tagSwitch} mode={controls.mode} tone="crimson" className="mx-0.5 align-middle" />.
                Wirst du zu zweit getroffen, springt sofort dein Partner als Extra-Leben ein! Verlorene Gefährten rettest du an leuchtenden{' '}
                <strong className="text-white">Gefährten-Kapseln</strong> zurück in dein Team.
              </div>

              {/* 4 Weapons */}
              <div>
                <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-semibold mb-2 flex items-center gap-2">
                  <span>4 wechselbare Waffen</span>
                  <InputPrompt label={controls.weaponCycle} mode={controls.mode} tone="crimson" />
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {WEAPON_ORDER.map((wId) => {
                    const spec = WEAPONS[wId];
                    return (
                      <div key={wId} className="p-3 rounded-xl bg-[#050506] border border-zinc-800 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-display font-bold uppercase tracking-wider text-white">
                            {controls.mode === 'keyboard' ? `[${spec.slot}] ` : ''}{spec.name}
                          </div>
                          <div className="text-xs text-zinc-400">{spec.role}</div>
                        </div>
                        <span className="px-2 py-1 rounded-lg bg-[#180808] border border-[#7F1D1D] text-[10px] font-mono-num text-[#EF4444] uppercase">
                          Schmiede-Stufe 1–4
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Version */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-wider text-zinc-400">
          <span>
            ROTE ASCHE · {GAME_VERSION} ({GAME_EDITION})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <InputPrompt label={controls.back} mode={controls.mode} />
            <InputPrompt label={controls.confirm} mode={controls.mode} />
            <span>Schließen</span>
          </span>
        </div>
      </div>
    </div>
  );
}
