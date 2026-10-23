# Identita Skin Studio

**Nosná myšlenka:** osobní studio jedné ženy, ne salonový řetězec. Web má působit jako Lucie sama:
klidná, precizní, s vlastním rukopisem. Opora jsou dvě věci, které má jen ona – **mramorová zeď**
z jejích portrétů a **její ruční podpis**.

## Motivy
- **Mramor:** jemné žilkování jako pozadí klidných sekcí (Filozofie / „Proč ke mně“), nikdy výrazně.
- **Zlatá kurzíva:** jedno slovo v nadpisu sekce kurzívou nadpisového písma ve zlaté – „Proč *ke mně*“.
- **Rukopis:** Sacramento jen pro Luciin podpis (vedle patkového písma v nadpisu působí tence a nesedí na řádku).

## Písma
- Nadpisy: **EB Garamond** 500/600 (místo všudypřítomné Playfair Display; Cormorant měl odtržené české háčky).
- Text a tlačítka: **Jost** 300/400/500 (místo systémového písma).
- Rukopis: **Sacramento** (jen podpis).

## Paleta (hex)
| Role | Hex | Odkud |
|---|---|---|
| Mramor – pozadí | `#F7F4F0` | zeď z portrétu |
| Mramor – plocha | `#EEE8E1` | stín zdi |
| Žilka / linky | `#D8CFC5` | žilkování |
| Tělová | `#E8D6C8` | pleť, světlo |
| Text tlumený | `#6B615A` | teplá šedá (5,5:1 na krémové; `#8A7F76` jen dekorace, ne text) |
| Grafit – text | `#2E2925` | Luciino tričko |
| Zlatá – plochy, linky, tmavé pozadí | `#B08D55` → `#DEC89A` | stávající značka |
| Zlatá – text na světlé | `#8C6A2E` (kurzíva, odkazy; 4,5:1) | ztmavená značka |
| Růžová PMU | `#C48F83` | stávající PMU |

Teplé šedé nahrazují studenou Tailwind paletu (`stone`/`gray`) – mapují se v `tailwind.config.cjs`.

## Tlačítka
- Hlavní akce: zlaté oblé (stávající `gold-satin`) s **tmavým textem** `#2E2925` (bílý na zlaté nesplní WCAG); PMU růžové s textem `#1F1B18`, min. 12 px.
- Vedlejší akce: textový odkaz verzálkami s tenkou linkou pod textem. Žádné hranaté rámečky.

## Čemu se nepodobat
- Šablonám „luxury beauty“ (Playfair + Inter, béžová, zlaté pilulky všude).
- Velkým řetězcům a e-shopům s kosmetikou (slevové štítky, odpočty, hvězdičky všude).

## Přístupnost (WCAG 2.2 AA, měření Data 23. 10. 2026)
- Text ≥ 4,5:1, velký text (24 px / tučné 18,66 px) ≥ 3:1. Měřit `scratchpad/kontrast.mjs` nebo DevTools.
- Zvýraznění v popisech služeb tučně v barvě textu, barevně jen nadpisy.
