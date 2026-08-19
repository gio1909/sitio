# Sítio 3D — Viamão

MVP de um "Google Earth particular" para visualizar e planejar a implantação
de uma casa no sítio localizado em Estr. da Varzinha, 2640 - Itapuã, Viamão -
RS (-30.282518, -50.990627).

## Análise técnica e decisão de arquitetura

**Escolha: CesiumJS + Cesium ion (Cesium World Terrain + Bing Aerial
imagery), React + TypeScript + Vite, geometria glTF para a casa.**

| Critério | CesiumJS + ion | Google Photorealistic 3D Tiles | Three.js puro | Mapbox/MapLibre |
|---|---|---|---|---|
| Terreno 3D real | ✅ nativo, global (SRTM) | ✅ (onde há malha fotorrealística) | ❌ precisa construir | ⚠️ "2.5D" (heightmap sobre plano) |
| Imagens de satélite | ✅ Bing Aerial incluído | ✅ | ❌ precisa integrar | ✅ |
| Cobertura na zona rural do sítio | ✅ (terreno global sempre existe) | ❓ incerta — cobertura fotorrealística é curada por cidade | — | ✅ |
| Posicionar objeto por lat/lon/altura | ✅ API nativa (`Cartesian3.fromDegrees`, `Entity`/`Model`) | ✅ (via Cesium também) | ❌ manual | ⚠️ possível, mais manual |
| Câmera órbita/inclinação/1ª pessoa | ✅ nativo | ✅ (via Cesium) | ❌ manual | ⚠️ parcial |
| Custo | Grátis (plano Community) | Pago acima de 1.000 req/mês (US$ 6/1000, SKU Enterprise) | Grátis (mas mais dev) | Grátis até cota, depois pago |
| Requer conta de billing | Não (Community) | Sim (GCP) | — | Não até cota |

Por que **não** Google Photorealistic 3D Tiles como base: a cobertura é
curada por cidade e concentrada em áreas urbanas densas — um sítio rural em
Itapuã/Viamão tem alta chance de não ter malha 3D fotorrealística, e não dá
para confirmar isso sem uma chave de API paga (billing habilitado). Arriscar
o MVP inteiro nisso não é prudente. A arquitetura não impede adicionar essa
camada depois, se você confirmar cobertura no [Coverage
Viewer](https://console.cloud.google.com/google/maps-apis/build/3d-map-tiles)
do Google.

Por que **não** Three.js puro: não tem terreno, imagery ou projeção
geoespacial nativos — seria necessário reimplementar streaming de tiles,
elevação e conversão de coordenadas do zero, sem ganho real para o MVP.

Por que **não** Mapbox/MapLibre: terreno "2.5D" (extrusão de heightmap sobre
um plano) é mais fraco para a experiência de "andar dentro da casa" pedida,
e a API de posicionamento de objetos 3D reais é menos madura que a do
Cesium.

### Dados: o que existe de verdade vs. o que foi simulado

| Dado | Fonte usada | Status |
|---|---|---|
| Imagens de satélite | Bing Maps Aerial (via Cesium ion) | ✅ real, cobertura global |
| Terreno/elevação | Cesium World Terrain (derivado de SRTM, ~30 m de resolução) | ✅ real, mas resolução moderada — mostra o relevo geral, não o "as-built" exato do terreno |
| Modelos 3D fotorrealísticos de edifícios | — | ❌ não usado (ver análise acima) |
| Limites exatos do terreno (polígono) | — | ❌ **não inventados**. O usuário forneceu apenas um ponto de referência. Ver "Importar Limites" abaixo |
| Casa 3D | Geometria procedural (paredes + telhado) | ✅ placeholder MVP, substituível por `house.glb` |

## Stack

- **React 19 + TypeScript + Vite** — front-end.
- **CesiumJS 1.132** (`vite-plugin-cesium` cuida dos assets estáticos).
- **Zustand** — estado global leve (posição/rotação da casa, modo de visão).
- **glTF/GLB** — formato de entrada para um modelo real de casa (futuro).
- **GeoJSON/KML** — importação dos limites reais do terreno (já implementado).

## Arquitetura do projeto

```
src/
  scene/       CesiumViewer.tsx (viewer, terreno, clique-para-posicionar), cameraControls.ts
  house/       HouseModel.ts (abstração casa procedural ⇄ GLB), houseGeometry.ts
  map/         siteMarker.ts (marcador do sítio), propertyBoundary.ts (import GeoJSON/KML)
  controls/    Toolbar.tsx, HousePanel.tsx (UI)
  state/       useSiteStore.ts (dados geográficos), useSceneStore.ts (estado do viewer/engine)
  utils/       geoConversion.ts (lat/lon/altura ⇄ Cartesian3, documentado), constants.ts
  types/       geo.ts
```

### Conversão de coordenadas (importante)

O Cesium trabalha em ECEF (Earth-Centered, Earth-Fixed) — cada ponto 3D é um
`Cartesian3` em metros a partir do centro da Terra. Para evitar erros de
precisão numérica, a aplicação **nunca** guarda a posição da casa como
`Cartesian3` cru: guarda sempre `{ longitude, latitude, height }` em graus/
metros, e converte para `Cartesian3` só na hora de desenhar
(`Cesium.Cartesian3.fromDegrees`). A altura é sempre relativa ao terreno:
antes de posicionar a casa, o código amostra a elevação real do relevo
naquele ponto (`scene.globe.getHeight`) e usa isso como base. A rotação
(heading) é aplicada via `Cesium.Transforms.headingPitchRollToFixedFrame`,
que constrói o referencial local Leste-Norte-Cima (ENU) no ponto exato do
globo — necessário porque numa esfera não existe um único eixo "para cima"
global. Detalhes comentados em `src/utils/geoConversion.ts`.

## Funcionalidades implementadas no MVP

- Mapa/terreno 3D com zoom, pan, rotação, inclinação (controles nativos do Cesium).
- Terreno real (Cesium World Terrain) + imagens de satélite (Bing Aerial), quando o token está configurado.
- Marcador do ponto de referência do sítio.
- 🏠 Adicionar/mover casa clicando no terreno (a casa é ancorada à elevação real do relevo).
- Casa procedural (paredes + telhado de duas águas), pronta para ser substituída por `public/models/house.glb`.
- Painel de edição: latitude, longitude, altitude, rotação, largura, comprimento, altura.
- 👁 Vista da Casa: câmera vai para a altura dos olhos (1,7 m) na posição da casa, olhando na direção do heading dela; pode olhar ao redor livremente.
- 🌎 Vista do Terreno / 📍 Centralizar Sítio: voltam para a visão aérea.
- 🗑 Remover Casa.
- 📐 Importar Limites: importa um arquivo GeoJSON ou KML com o polígono real do terreno (ver abaixo).

## Limites do terreno (GeoJSON/KML)

As coordenadas fornecidas são só o **ponto de referência**, não o polígono
do terreno — nada foi inventado. Para desenhar os limites reais mais tarde:

1. Desenhe/exporte o polígono em uma ferramenta como
   [geojson.io](https://geojson.io), Google Earth (exportar como KML), ou
   um levantamento georreferenciado (ex.: SIGEF/INCRA).
2. Clique em **📐 Importar Limites** na barra de ferramentas e selecione o
   arquivo `.geojson`/`.json` ou `.kml`.

## Configuração de APIs

### Cesium ion (obrigatório para terreno 3D real + imagens de satélite)

Sem essa chave, a aplicação ainda roda (fallback: globo elipsoidal sem
relevo + camada OpenStreetMap), mas sem terreno 3D real.

1. Crie uma conta gratuita em <https://ion.cesium.com/signup>.
2. Vá em **Access Tokens** → crie um token novo (ou use o `Default Token`).
3. Copie `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Cole o token em `.env.local`:
   ```
   VITE_CESIUM_ION_TOKEN=seu_token_aqui
   ```
5. (Recomendado) Restrinja o token em ion.cesium.com → seu token → **URL
   restrictions**, limitando aos domínios onde a aplicação vai rodar (ex.:
   `http://localhost:5173`, e depois seu domínio de produção).

**Custo:** o plano **Community** do Cesium ion é gratuito para uso pessoal
(5 GB de armazenamento, 15 GB de streaming/mês) — mais que suficiente para
este MVP. Acima disso, os planos pagos começam em US$ 149/mês. Fonte:
[cesium.com/platform/cesium-ion/pricing](https://cesium.com/platform/cesium-ion/pricing/).

### Google Maps / Google Photorealistic 3D Tiles

**Não usado neste MVP** (ver análise técnica acima). Caso queira testar essa
opção no futuro: exige projeto no Google Cloud com billing habilitado,
ativar a **Map Tiles API**, e gera custo por requisição acima da cota
gratuita (1.000 eventos grátis/mês, depois US$ 6,00 por 1.000 requisições
para tiles 3D fotorrealísticos — SKU Enterprise). Fonte:
[developers.google.com/maps/documentation/tile/usage-and-billing](https://developers.google.com/maps/documentation/tile/usage-and-billing).

## Como rodar

```bash
npm install
cp .env.example .env.local   # e cole seu token do Cesium ion
npm run dev
```

Abra `http://localhost:5173`.

Build de produção:

```bash
npm run build
npm run preview
```

## Substituir a casa procedural por um modelo real

Coloque um arquivo `house.glb` em `public/models/house.glb`. A aplicação
detecta o arquivo automaticamente e passa a carregá-lo no lugar da geometria
procedural — nenhuma outra mudança de código é necessária. Detalhes em
`public/models/README.md`.

## Limitações conhecidas do MVP

- Resolução do terreno (~30 m, SRTM) mostra o relevo geral do sítio, não a
  topografia exata "as-built" — suficiente para estudo de implantação
  inicial, não para projeto executivo.
- O polígono dos limites do terreno não está desenhado por padrão (só o
  ponto de referência) — use "Importar Limites" quando tiver o arquivo.
- A casa é procedural (placeholder visual), não um modelo arquitetônico real.
- Testado neste ambiente sandbox sem acesso irrestrito à internet (tiles de
  satélite/terreno não puderam ser baixados durante o desenvolvimento aqui);
  a lógica de carregamento foi validada e roda corretamente assim que há
  rede — confirme o carregamento das imagens/terreno no seu navegador local
  com o token configurado.

## Roadmap (arquitetura já preparada, não implementado ainda)

- Múltiplas casas, galpões, piscina, árvores, cercas, estradas internas.
- Medição de distância/área, análise de declividade.
- Posição do sol por horário/data, sombras.
- Salvar versões diferentes do projeto (persistência).
- Substituição da casa procedural por modelo GLB real (já suportado pela abstração `HouseModel`).
