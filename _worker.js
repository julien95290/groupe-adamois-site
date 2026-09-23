// ============================================================================
// Cloudflare Pages — routing par domaine (advanced mode / _worker.js)
//
// Objectif : servir 3 vitrines distinctes depuis un seul projet.
//   - adamoisrenov.com  -> contenu du dossier /adamois/  (Adamois Renov' only)
//   - majel-lift.com    -> contenu du dossier /majel/    (Majel Lift only)
//   - pages.dev (par défaut) -> contenu de la racine     (hub double-univers)
//
// L'URL affichée dans le navigateur ne change pas : le rewrite est transparent
// (on modifie le chemin côté serveur avant de servir l'asset).
// ============================================================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    let pathname = url.pathname;

    // 1) Toujours servir tel quel : ressources partagées et fichiers déjà
    //    préfixés par /adamois/ ou /majel/ (accès direct pour QA).
    const isSharedOrPrefixed =
      pathname.startsWith('/images/')        ||
      pathname.startsWith('/adamois/')       ||
      pathname.startsWith('/majel/')         ||
      pathname === '/sitemap.xml'            ||
      pathname === '/robots.txt'             ||
      pathname === '/favicon.ico'            ||
      pathname === '/index.backup-2026-05-13.html'; // évite qu'il soit rewrité

    if (isSharedOrPrefixed) {
      return env.ASSETS.fetch(request);
    }

    // 2) Choisir le préfixe selon le domaine visité.
    let prefix = null;
    if (hostname === 'adamoisrenov.com' || hostname === 'www.adamoisrenov.com') {
      prefix = '/adamois';
    } else if (hostname === 'majel-lift.com' || hostname === 'www.majel-lift.com') {
      prefix = '/majel';
    }

    // 3) Domaine par défaut (pages.dev ou tout autre custom domain non listé) :
    //    on sert le hub double-univers à la racine, sans rewrite.
    if (prefix === null) {
      return env.ASSETS.fetch(request);
    }

    // 4) Sinon, on rewrite le path en ajoutant le préfixe.
    const newUrl = new URL(request.url);
    newUrl.pathname = prefix + pathname;
    const rewritten = new Request(newUrl.toString(), request);
    return env.ASSETS.fetch(rewritten);
  }
};
