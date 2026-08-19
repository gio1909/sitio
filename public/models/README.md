# Modelo 3D da casa (opcional)

Coloque aqui um arquivo `house.glb` (ou `house.gltf` + texturas) para
substituir a casa procedural do MVP por um modelo arquitetônico real.

A aplicação verifica automaticamente (`fetch HEAD /models/house.glb`) se
esse arquivo existe:

- Se existir → carrega o modelo via `Cesium.Model.fromGltfAsync`.
- Se não existir → desenha a casa procedural simples (paredes + telhado),
  gerada em `src/house/houseGeometry.ts`.

Nenhuma outra mudança de código é necessária — ver `src/house/HouseModel.ts`.

Recomendações para o modelo:
- Origem (0,0,0) no centro da base da casa (nível do chão), eixo Z para cima.
- Escala em metros reais.
- Formato glTF binário (.glb) otimizado (Draco/texturas comprimidas) para
  bom desempenho.
