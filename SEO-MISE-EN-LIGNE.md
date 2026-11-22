# Référencement et mise en ligne

## Priorités tirées de Search Console

Du 18 août au 17 novembre 2026, le site a obtenu 4 875 impressions et 113 clics dans les résultats Web de Google, dont 90 sur mobile. Ces chiffres serviront de point de comparaison après publication.

| Recherche | Impressions | Clics | Position moyenne |
| --- | ---: | ---: | ---: |
| jardinier perpignan | 248 | 5 | 9,4 |
| débroussaillage perpignan | 91 | 0 | 46,1 |
| taille de haie perpignan | 79 | 0 | 37,7 |
| paysagiste perpignan | 608 | 2 | 12,8 |

L’accueil répond à la recherche « jardinier à Perpignan ». La taille de haies et le débroussaillage restent les deux priorités d’après les recherches observées. À ta demande, la proposition couvre aussi la tonte de gazon, l’arrosage, la plantation et l’entretien des fleurs. Les six prestations ont chacune une page reliée depuis l’accueil. Les zones d’intervention doivent refléter les communes réellement desservies. Le contenu cible les petits travaux de jardinage à domicile. La proposition privilégie le vocabulaire de l’entretien de jardin, conformément au périmètre des prestations.

Pour les résultats locaux et Google Maps, vérifier que la fiche d’établissement, si elle existe, indique le même site, le bon téléphone et la zone d’intervention réelle. Des photos de réalisations récentes permettent aussi de montrer le travail avant le premier contact. [Conseils Google pour le classement local](https://support.google.com/business/answer/7091?hl=fr)

## Adresses de référence

Le domaine de référence est `https://www.uncoupdepousse.fr`. Le sitemap fourni liste l’accueil à la racine, les anciennes pages conservées et les six pages de prestations. Le fichier `robots.txt` indique où trouver ce sitemap. La page `espace-client.html` porte une directive `noindex` et reste hors sitemap. Il en va de même pour `/newsletter/` tant que l’archive est vide. L’archive et les éditions pourront y être ajoutées dès qu’elles contiendront des contenus effectivement publiés en HTML. [Guide Google sur les sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap?hl=fr)

Dans **Settings → Pages** sur GitHub, vérifier que le domaine personnalisé est `www.uncoupdepousse.fr`, que le certificat est valide et que l’option **Enforce HTTPS** est activée. Tester l’adresse avec et sans `www`, en HTTP et en HTTPS. Si le domaine sans `www` échoue encore, vérifier sa configuration chez Gandi selon le guide GitHub et conserver les enregistrements de messagerie et de validation Search Console. [Domaine personnalisé GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) · [HTTPS sur GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)

Une redirection HTTP permanente `301` ou `308` envoie le navigateur à la nouvelle adresse. Une balise `rel="canonical"` indique à Google l’adresse à privilégier quand plusieurs URL servent la même page. Sur GitHub Pages, l’accueil est servi par `index.html` et le réglage HTTPS ne traite pas les variantes de chemin. Le balisage de l’accueil, le sitemap et les liens internes doivent donc tous privilégier `/`. Une redirection serveur de `/index.html` vers `/` nécessite une couche capable de configurer les réponses HTTP par chemin. [Choisir une URL canonique](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=fr) · [Redirections et Google](https://developers.google.com/search/docs/crawling-indexing/301-redirects?hl=fr) · [Hébergement statique GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

## Vérifications lors de la mise en ligne

1. Repérer la version actuellement publiée dans GitHub et noter son identifiant pour pouvoir la rétablir. Si un changement DNS s’avère nécessaire, relever d’abord les valeurs concernées.
2. Sur la version approuvée, suivre les six liens de prestations depuis l’accueil sur mobile et vérifier leurs titres, descriptions et coordonnées de contact. Tester également les appels, les versions en français, catalan et anglais et les adresses du sitemap. Chaque adresse du sitemap doit répondre en HTTPS avec un statut `200`, présenter une URL canonique cohérente et être indexable. Vérifier le `noindex` de l’espace client et de l’archive newsletter vide. Tester les redirections des adresses historiques concernées et vérifier l’absence de ressources chargées en HTTP.
3. Dans **Search Console → Sitemaps**, soumettre `https://www.uncoupdepousse.fr/sitemap.xml`. Inspecter l’accueil et les six pages de prestations, en commençant par Taille de haies et Débroussaillage. Relever l’adresse canonique choisie par Google et surveiller le rapport **Indexation → Pages**.
4. Après quelques semaines, comparer des périodes de même durée dans **Performances**. Suivre d’abord les clics et impressions pour « jardinier perpignan », la taille de haies et le débroussaillage. Examiner ensuite les recherches liées aux autres prestations en tenant compte de la saison. [Utiliser Search Console](https://developers.google.com/search/docs/monitor-debug/search-console-start?hl=fr)

Si une page utile ou le contact devient inaccessible, rétablir la version GitHub précédente, puis revérifier l’accueil, les anciennes pages, HTTPS et le sitemap. Si l’incident vient d’un changement DNS, rétablir les valeurs concernées et attendre la propagation avant de refaire les contrôles.
