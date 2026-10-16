<?php
/**
 * Plugin Name: Platinatore, innesti headless
 * Description: Cio' che WordPress deve fare per servire il sito Next.js: avvisare quando si
 *              pubblica, dire dove sta un articolo che ha cambiato indirizzo, mandare l'anteprima
 *              e i link sul sito pubblico, e non farsi indicizzare.
 * Version: 1.0
 *
 * Adattato da evalis-headless.php (EvalisDeck). Sta in mu-plugins: si carica sempre e non si
 * disattiva dalla dashboard. Se queste funzioni si spegnessero per sbaglio, il sito smetterebbe
 * di aggiornarsi senza che nessuno riceva un errore.
 *
 * Differenza dal riferimento: qui l'indirizzo contiene la DATA (/AAAA/MM/GG/slug/). Un articolo
 * cambia indirizzo se cambia lo slug O la data, quindi le risposte danno il percorso completo.
 */

if (!defined('ABSPATH')) {
    exit;
}

/** Il percorso pubblico di un articolo: quello che WordPress calcola, senza il dominio del CMS. */
function platinatore_percorso($post)
{
    $url = get_permalink($post);
    return $url ? wp_make_link_relative($url) : null;
}

/* ---------------------------------------------------------------------------------------
 * 1. AVVISA IL SITO QUANDO SI PUBBLICA
 * ------------------------------------------------------------------------------------- */

function platinatore_avvisa_il_sito($post)
{
    if (!defined('PLATINATORE_SITO_PUBBLICO') || !defined('PLATINATORE_REVALIDATE_TOKEN')) {
        return;
    }

    $tag = wp_get_post_terms($post->ID, 'post_tag', array('fields' => 'slugs'));
    $categorie = wp_get_post_terms($post->ID, 'category', array('fields' => 'slugs'));

    wp_remote_post(rtrim(PLATINATORE_SITO_PUBBLICO, '/') . '/api/revalidate', array(
        'timeout'  => 8,
        'blocking' => false, // chi pubblica non aspetta il sito. Da wp-cli quindi NON parte.
        'headers'  => array(
            'Content-Type' => 'application/json',
            'x-cms-token'  => PLATINATORE_REVALIDATE_TOKEN,
        ),
        'body'     => wp_json_encode(array(
            'id'        => $post->ID,
            'percorso'  => platinatore_percorso($post),
            'tag'       => is_wp_error($tag) ? array() : $tag,
            'categorie' => is_wp_error($categorie) ? array() : $categorie,
        )),
    ));
}

// pubblicazione, modifica, ritorno in bozza, cestino: ognuno cambia cio' che il sito mostra
add_action('transition_post_status', function ($nuovo, $vecchio, $post) {
    if ($post->post_type === 'post' && ($nuovo === 'publish' || $vecchio === 'publish')) {
        platinatore_avvisa_il_sito($post);
    }
}, 10, 3);

add_action('trashed_post', function ($id) {
    $post = get_post($id);
    if ($post && $post->post_type === 'post') {
        platinatore_avvisa_il_sito($post);
    }
});

/* ---------------------------------------------------------------------------------------
 * 2. DOVE STA ADESSO UN ARTICOLO CHE HA CAMBIATO INDIRIZZO
 *
 * WordPress conserva slug e date vecchi (`_wp_old_slug`, `_wp_old_date`) ma non li espone.
 * Il sito, davanti a un indirizzo che non esiste, chiede qui e risponde 301 invece di 404.
 * Pubblica di proposito: non rivela nulla che non sia gia' online.
 * ------------------------------------------------------------------------------------- */

add_action('rest_api_init', function () {
    register_rest_route('platinatore/v1', '/indirizzo-precedente', array(
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'args'                => array(
            'slug' => array('required' => true, 'type' => 'string'),
            'data' => array('required' => false, 'type' => 'string'), // AAAA-MM-GG
        ),
        'callback'            => function ($richiesta) {
            global $wpdb;
            $slug = sanitize_title($richiesta->get_param('slug'));
            $data = (string) $richiesta->get_param('data');
            if ($slug === '') {
                return null;
            }

            $candidati = array();

            // a) lo slug e' cambiato
            $id = $wpdb->get_var($wpdb->prepare(
                "SELECT post_id FROM {$wpdb->postmeta}
                 WHERE meta_key = '_wp_old_slug' AND meta_value = %s
                 ORDER BY meta_id DESC LIMIT 1",
                $slug
            ));
            if ($id) {
                $candidati[] = (int) $id;
            }

            // b) lo slug e' lo stesso ma la data e' cambiata
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $data)) {
                $id = $wpdb->get_var($wpdb->prepare(
                    "SELECT p.ID FROM {$wpdb->posts} p
                     JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = '_wp_old_date'
                     WHERE p.post_name = %s AND m.meta_value = %s
                     ORDER BY m.meta_id DESC LIMIT 1",
                    $slug,
                    $data
                ));
                if ($id) {
                    $candidati[] = (int) $id;
                }
            }

            foreach ($candidati as $id) {
                $post = get_post($id);
                if ($post && $post->post_status === 'publish' && $post->post_type === 'post') {
                    return array('percorso' => platinatore_percorso($post));
                }
            }
            return null;
        },
    ));
});

/* ---------------------------------------------------------------------------------------
 * 3. ANTEPRIMA E LINK PORTANO SUL SITO PUBBLICO
 * ------------------------------------------------------------------------------------- */

add_filter('preview_post_link', function ($link, $post) {
    if (!defined('PLATINATORE_SITO_PUBBLICO') || !defined('PLATINATORE_PREVIEW_TOKEN')) {
        return $link;
    }
    if (!$post || $post->post_type !== 'post') {
        return $link;
    }
    return add_query_arg(
        array('token' => PLATINATORE_PREVIEW_TOKEN, 'id' => $post->ID),
        rtrim(PLATINATORE_SITO_PUBBLICO, '/') . '/api/preview'
    );
}, 10, 2);

// «Visualizza articolo» e il campo `link` della REST portano al sito pubblico, stesso percorso.
// Si sostituisce solo il dominio: la forma /AAAA/MM/GG/slug/ la calcola WordPress.
add_filter('post_link', function ($url, $post) {
    if (!defined('PLATINATORE_SITO_PUBBLICO') || !$post || $post->post_type !== 'post') {
        return $url;
    }
    return rtrim(PLATINATORE_SITO_PUBBLICO, '/') . wp_make_link_relative($url);
}, 10, 2);

/* ---------------------------------------------------------------------------------------
 * 4. IL CMS NON SI FA INDICIZZARE E NON PROPONE SITEMAP CONCORRENTI
 * Terzo strato, dopo l'header di Caddy e l'impostazione di WordPress.
 * ------------------------------------------------------------------------------------- */

add_filter('wpseo_enable_xml_sitemap', '__return_false');   // Yoast
add_filter('wp_sitemaps_enabled', '__return_false');        // sitemap di WordPress
add_filter('xmlrpc_enabled', '__return_false');             // Caddy lo blocca gia'

// NB dal riferimento: l'elenco delle rotte REST NON va filtrato a mano (`rest_endpoints`): un
// filtro cosi' ha mandato in errore fatale tutta la REST API.
