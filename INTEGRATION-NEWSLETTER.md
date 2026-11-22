# Newsletter de Gestion et GitHub Pages

Les fichiers `.github/newsletter/pages.mjs` et `.github/workflows/newsletter-pages.yml` construisent le site vitrine et ses newsletters à partir du dépôt `vivienhaese/uncoupdepousse`, branche `master`. Le formulaire d’inscription et le portail client sont des fonctions séparées.

## Flux et adresses

Le workflow lit le flux HTTPS public de Gestion `https://gestion.uncoupdepousse.fr/newsletter-publique/editions.json`. Il accepte le format `{format:1, editions, next}`, suit la pagination et trie les éditions par date décroissante. La sélection « Afficher sur le site vitrine » est appliquée par Gestion à la source. GitHub ne lit ni le portail connecté ni les données des abonnés.

La première édition apparaît en tête de `/newsletter/` et chacune dispose d’une page HTML à `/newsletter/<clé>/`. La clé est l’identifiant fourni par Gestion. Modifier le titre ou le texte ne change donc pas l’adresse. Au retrait, le prochain déploiement retire la page et les liens associés. Une archive vide reste accessible et hors index. Quand elle contient des éditions, le sitemap newsletter est déclaré dans `robots.txt`. Le sitemap principal est conservé.

La tâche planifiée vérifie le flux chaque heure et déploie seulement si la révision diffère. Le bouton **Run workflow** permet aussi de reconstruire le site à la demande. Si la lecture échoue, GitHub Actions garde le dernier déploiement et signale l’erreur. [Workflow de publication GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Premier déploiement

1. Vérifier l’accès en écriture sur le dépôt. Le propriétaire peut ajouter `Roms66200` dans **Settings → Collaborators**. Romain doit accepter l’invitation et vérifier que l’application GitHub connectée à Codex est autorisée à accéder à ce dépôt.
2. Depuis une branche de travail, vérifier l’artefact de la refonte avec le workflow et l’archive fictive locale. Les fichiers de la maquette d’aperçu distribuée antérieurement portent une directive `noindex`. Utiliser le dossier source préparé pour la production.
3. Lors de la mise en ligne, coordonner la fusion dans `master` et le passage de **Settings → Pages → Build and deployment → Source** à **GitHub Actions**. La source actuelle est `master` à la racine. Le propriétaire intervient pour le réglage Pages. Conserver le domaine personnalisé `www.uncoupdepousse.fr` et vérifier **Enforce HTTPS**. [Source GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) · [HTTPS GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
4. Vérifier l’exécution **Actions → Vitrine et newsletters**. Au besoin, lancer **Run workflow** sur `master`. Vérifier en ligne l’accueil, le lien **Newsletter**, le domaine HTTPS et l’accès au formulaire. Si le flux contient une édition publique, vérifier aussi sa page et son URL canonique.

Le formulaire d’inscription de l’ancien site est encore affiché mais envoie vers un serveur OpenShift en HTTP dont le domaine ne se résout plus. Pour rétablir l’inscription, récupérer l’URL HTTPS du formulaire ou du service qui collecte les inscriptions actuellement. La refonte contient un formulaire de contact qui lance la messagerie du visiteur. Son fonctionnement est distinct de l’inscription à la newsletter.

Les essais de publication, de correction et de retrait sont effectués avec des données fictives locales. Les fichiers de test et les éditions fictives ne font pas partie du dépôt préparé pour la production.

## Déclenchement depuis Gestion

Après vérification du site en production, confirmer que le Worker Gestion utilise `workflow_dispatch` vers l’API GitHub `/repos/vivienhaese/uncoupdepousse/actions/workflows/newsletter-pages.yml/dispatches` avec la branche `master`. Pour cet appel, un jeton GitHub à permissions fines limité au dépôt, avec **Actions en écriture**, suffit. L’accès de création du jeton au dépôt doit être vérifié auprès du propriétaire. [Permissions de l’API GitHub](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event)

Dans Cloudflare, ouvrir **Workers & Pages → Worker de Gestion → Settings → Variables and Secrets → Add**. Choisir **Secret** et saisir le nom `NEWSLETTER_PAGES_TOKEN`. Coller le jeton dans Cloudflare et enregistrer ou déployer le changement dans l’environnement de production. Contrôler ensuite qu’une modification d’édition publique effectuée dans Gestion déclenche une nouvelle exécution dans GitHub Actions. [Secrets des Workers Cloudflare](https://developers.cloudflare.com/workers/configuration/secrets/#via-the-dashboard)
