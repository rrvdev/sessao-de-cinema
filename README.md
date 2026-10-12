# Sessão de Cinema

Salas para assistir junto com os amigos, no estilo dos servidores do Discord: qualquer pessoa na sala transmite a **tela, a janela de um app ou uma guia do navegador, com som**, direto para o navegador de quem quiser assistir. Sem conta e sem instalar nada.

**Abrir:** https://rrvdev.github.io/sessao-de-cinema/

## Como usar

1. Escolha seu nome e clique em **Criar uma sala**. As salas em que você esteve ficam na barra à esquerda.
2. Clique em **Convidar** e mande o link para a galera. Quem abre o link escolhe um nome e entra.
3. Qualquer um clica em **Tela ou janela** para transmitir; os outros escolhem a quem assistir em **Pessoas**. Só quem está assistindo usa a internet de quem transmite.

Som: ao compartilhar a **janela de um app** com o áudio marcado, vai só o som daquele app (Chrome ou Edge 141+); numa guia, só o som da guia; na tela inteira, o som do computador todo. Para um filme salvo no PC, abra no VLC e compartilhe a janela dele.

## Filmes

A aba **Filmes** ajuda a escolher o que assistir:

- **Catálogo IMDb**: ~19 mil filmes com nota e votos do IMDb, título no Brasil, filtros por gênero, década e nota mínima, e busca. Vem dos [conjuntos de dados não comerciais do IMDb](https://developer.imdb.com/non-commercial-datasets/), convertidos toda semana pelo GitHub Actions (`scripts/build-imdb.mjs` → `data/imdb-movies.json`).
- **Em alta agora**: listas do [TMDB](https://www.themoviedb.org/) (em alta, populares, nos cinemas), com pôster, sinopse e onde assistir no Brasil (dados da JustWatch).

## Qualidade

Na aba **Qualidade**, quem transmite escolhe predefinição, resolução (480p até 4K), quadros por segundo (24/30/60), bitrate máximo por pessoa (0,5 a 200 Mbps), prioridade (fluidez, nitidez ou equilibrado) e codec (automático, H.264, VP9 ou AV1). A lista de pessoas mostra o que cada um está recebendo de verdade.

## Instalar como app

A página é um PWA: no Chrome ou no Edge, clique em **Instalar app**. Ele ganha ícone no menu Iniciar, abre em janela própria e carrega mesmo com a internet oscilando.

## Como funciona

Tudo fica num único `index.html`. A conexão é WebRTC direta entre os navegadores, criptografada. O [PeerJS](https://peerjs.com/) e o servidor público dele servem só para os navegadores se encontrarem. Cada sala tem uma "portaria" (um id fixo no PeerJS) com um coordenador eleito pela ordem de chegada; se ele sair ou cair, outra pessoa assume.

Serviços como Netflix e Prime Video aparecem com tela preta quando transmitidos por causa da proteção contra cópia.

Informações de filmes cortesia do IMDb (imdb.com), usadas com permissão. Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
