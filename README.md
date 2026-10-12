# Sessão de Cinema

Página para assistir filmes junto com os amigos: quem cria a sala transmite um arquivo de vídeo do PC, ou uma tela/aba, **com som**, direto para o navegador de quem assiste. Sem conta e sem instalar nada.

**Abrir:** https://rrvdev.github.io/sessao-de-cinema/

## Como usar

1. Quem vai transmitir abre a página no Chrome ou no Edge, clica em **Criar sala** e manda o código (ou o link) para a galera.
2. Escolhe **Arquivo de vídeo** (melhor qualidade) ou **Tela ou aba** (marque o áudio da guia ou do sistema na janela do Chrome).
3. Os amigos abrem a página, digitam o código e clicam em **Entrar**.

## Qualidade

Na aba **Qualidade**, quem transmite escolhe:

- **Predefinição**: Econômica, Padrão, Alta, Ultra, 4K ou Personalizada.
- **Resolução** (480p até 4K, ou a original da fonte) e **quadros por segundo** (24, 30 ou 60).
- **Bitrate máximo por pessoa**, de 0,5 a 200 Mbps.
- **Prioridade** quando a internet aperta: fluidez, nitidez ou equilibrado.
- **Codec**: automático (H.264, ou VP9 acima de 1440p), H.264, VP9 ou AV1.

A transmissão já começa na resolução escolhida, e a lista de pessoas mostra o que cada amigo está recebendo de verdade.

## Como funciona

Tudo fica num único `index.html`. A conexão é WebRTC direta entre os navegadores, criptografada. O [PeerJS](https://peerjs.com/) e o servidor público dele servem só para os navegadores se encontrarem (e, se a rede bloquear a conexão direta, para repassar o tráfego).

Serviços como Netflix e Prime Video aparecem com tela preta quando transmitidos por causa da proteção contra cópia.
