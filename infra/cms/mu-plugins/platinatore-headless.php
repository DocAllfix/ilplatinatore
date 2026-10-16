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
    // una volta sola per articolo e per richiesta: un salvataggio via REST fa scattare sia il cambio
    // di stato sia rest_after_insert_post
    static $avvisati = array();
    if (isset($avvisati[$post->ID])) {
        return;
    }
    $avvisati[$post->ID] = true;

    $tag = wp_get_post_terms($post->ID, 'post_tag', array('fields' => 'slugs'));
    $categorie = wp_get_post_terms($post->ID, 'category', array('fields' => 'slugs'));

    // BLOCCANTE, con tempo massimo breve. Il riferimento usava `blocking => false`, ma con HTTPS
    // PHP puo' chiudere la connessione prima che la richiesta parta davvero: collaudato il
    // 16/10/2026, una modifica via REST non arrivava al sito. Bloccante costa a chi pubblica circa
    // mezzo secondo e funziona sempre, anche da wp-cli e dal cron degli articoli programmati.
    $risposta = wp_remote_post(rtrim(PLATINATORE_SITO_PUBBLICO, '/') . '/api/revalidate/', array(
        'timeout'  => 3,
        'blocking' => true,
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
    // un webhook che fallisce non deve restare muto: finisce nel registro di PHP del contenitore
    if (is_wp_error($risposta) || wp_remote_retrieve_response_code($risposta) !== 200) {
        error_log('[platinatore] webhook non riuscito per il post ' . $post->ID . ': ' .
            (is_wp_error($risposta) ? $risposta->get_error_message() : wp_remote_retrieve_response_code($risposta)));
    }
}

// pubblicazione, modifica, ritorno in bozza, cestino: ognuno cambia cio' che il sito mostra
// Nelle richieste REST (wpvibe, editor a blocchi) il cambio di stato scatta PRIMA che i campi
// (meta) siano salvati: avvisare qui farebbe rigenerare il sito con i dati vecchi (collaudato il
// 16/10/2026). Nella REST l'articolo va in coda e l'avviso parte da rest_after_insert_post, che
// WordPress lancia dopo aver salvato tutto. Fuori dalla REST (dashboard classica, cron, wp-cli)
// si avvisa subito.
$GLOBALS['platinatore_coda'] = array();

add_action('transition_post_status', function ($nuovo, $vecchio, $post) {
    if ($post->post_type !== 'post' || ($nuovo !== 'publish' && $vecchio !== 'publish')) {
        return;
    }
    if (defined('REST_REQUEST') && REST_REQUEST) {
        $GLOBALS['platinatore_coda'][$post->ID] = true;
        return;
    }
    platinatore_avvisa_il_sito($post);
}, 10, 3);

// Una modifica che tocca SOLO i campi (meta) via REST, come fa wpvibe con la scheda della guida o
// l'editor a blocchi con i riquadri dei campi, non cambia lo stato dell'articolo: senza questo
// aggancio il sito non lo saprebbe mai (collaudato il 16/10/2026).
add_action('rest_after_insert_post', function ($post) {
    if (!($post instanceof WP_Post) || $post->post_type !== 'post') {
        return;
    }
    // pubblicato (anche se sono cambiati solo i campi) oppure appena uscito dalla pubblicazione
    if ($post->post_status === 'publish' || isset($GLOBALS['platinatore_coda'][$post->ID])) {
        platinatore_avvisa_il_sito(get_post($post->ID));
    }
});

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
        rtrim(PLATINATORE_SITO_PUBBLICO, '/') . '/api/preview/'
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

/* ---------------------------------------------------------------------------------------
 * 5. CAMPI DELLA GUIDA: SCHEDA RIASSUNTIVA E TROFEI (PDF 03, 05, 06; decisione D9)
 *
 * Dati strutturati invece di tabelle nel testo: il sito li legge per primi e ripiega sulle
 * tabelle solo se mancano. Leggibili e SCRIVIBILI dalla REST (`meta` del post), perche' si
 * pubblica anche con wpvibe.
 *
 * Con wpvibe attivo si registrano con il suo sistema di campi: riquadro «Scheda della guida»
 * nell'editor e campi noti all'AI. Senza wpvibe (disattivato, rimosso, CMS di lavoro) si
 * registrano qui, nativi e con lo STESSO formato: i dati sono post meta normali e non si perdono
 * in nessun caso. Il sito pubblico non deve mai dipendere da un plugin per leggerli.
 * ------------------------------------------------------------------------------------- */

function platinatore_campi_guida()
{
    $g = 'platinatore_scheda';
    return array(
        'pl_difficolta'      => array('type' => 'number', 'group' => $g, 'label' => 'Difficoltà (1-10)', 'description' => 'Stima della redazione. 0 = non indicata.'),
        'pl_ore_platino'     => array('type' => 'text', 'group' => $g, 'label' => 'Tempo per il platino', 'description' => 'Es. «15-25 ore». Trattino normale, non lungo.'),
        'pl_partite'         => array('type' => 'text', 'group' => $g, 'label' => 'Partite minime', 'description' => 'Es. «1».'),
        'pl_mancabili'       => array('type' => 'text', 'group' => $g, 'label' => 'Trofei mancabili', 'description' => 'Numero e nomi: «1, Sfratto Abissale». «0» se nessuno.'),
        'pl_online'          => array('type' => 'text', 'group' => $g, 'label' => 'Trofei online', 'description' => 'Es. «0» oppure «2, Co-op».'),
        'pl_trofei_totali'   => array('type' => 'number', 'group' => $g, 'label' => 'Trofei totali', 'description' => 'Platino compreso.'),
        'pl_nota_stime'      => array('type' => 'text', 'group' => $g, 'label' => 'Condizioni delle stime', 'description' => 'Facoltativo: da cosa dipendono tempo e difficoltà, differenze fra versioni.'),
        'pl_altri_dati'      => array('type' => 'textarea', 'group' => $g, 'label' => 'Altri dati', 'description' => 'Una voce per riga, «Etichetta: valore». Es. «Salvataggi manuali: No».'),
        'pl_trofei'          => array(
            'type'        => 'repeater',
            'group'       => $g,
            'label'       => 'Trofei da spuntare',
            'description' => 'Un trofeo per riga. «Gruppo» raggruppa la checklist (es. «Boss e storia»).',
            'sub_fields'  => array(
                'gruppo' => array('type' => 'text', 'label' => 'Gruppo'),
                'nome'   => array('type' => 'text', 'label' => 'Trofeo'),
                'come'   => array('type' => 'textarea', 'label' => 'Come ottenerlo'),
            ),
        ),
        // PDF 06: tabella dei mancanti in testa agli articoli dei collezionabili
        'pl_collezionabili'  => array(
            'type'        => 'repeater',
            'group'       => $g,
            'label'       => 'Collezionabili da spuntare',
            'description' => 'Un oggetto per riga. «Sezione»: il titolo (h2) del paragrafo che spiega come prenderlo, copiato uguale. «Spoiler»: «si» per nasconderne il nome.',
            'sub_fields'  => array(
                'area'         => array('type' => 'text', 'label' => 'Area'),
                'oggetto'      => array('type' => 'text', 'label' => 'Oggetto'),
                'tipo'         => array('type' => 'text', 'label' => 'Tipo (Ambra, Arma...)'),
                'prerequisito' => array('type' => 'text', 'label' => 'Prerequisito'),
                'sezione'      => array('type' => 'text', 'label' => 'Sezione con la soluzione'),
                'spoiler'      => array('type' => 'text', 'label' => 'Spoiler (si/vuoto)'),
            ),
        ),
        // PDF 07: correlati contestuali, nel punto del testo in cui servono
        'pl_correlati'       => array(
            'type'        => 'repeater',
            'group'       => $g,
            'label'       => 'Correlati nel testo',
            'description' => 'Compare alla fine della sezione indicata (titolo h2 copiato uguale). «Articolo»: lo slug della guida collegata. Se non è pubblicata non compare.',
            'sub_fields'  => array(
                'tipo'         => array('type' => 'text', 'label' => 'Etichetta (es. «Prima di continuare»)'),
                'articolo'     => array('type' => 'text', 'label' => 'Slug dell\'articolo'),
                'perche'       => array('type' => 'textarea', 'label' => 'Perché leggerlo qui'),
                'dopo_sezione' => array('type' => 'text', 'label' => 'Dopo la sezione'),
            ),
        ),
    );
}

add_action('plugins_loaded', function () {
    if (!function_exists('wpvibe_field_register')) {
        return;
    }
    if (function_exists('wpvibe_field_group_register')) {
        wpvibe_field_group_register('post', 'platinatore_scheda', array('title' => 'Scheda della guida', 'context' => 'normal', 'priority' => 'high'));
    }
    foreach (platinatore_campi_guida() as $chiave => $config) {
        wpvibe_field_register('post', $chiave, $config);
    }
});

// Senza wpvibe: stessi campi, nativi. Stesso schema REST del ripetitore di wpvibe.
add_action('init', function () {
    if (function_exists('wpvibe_field_register')) {
        return;
    }
    foreach (platinatore_campi_guida() as $chiave => $config) {
        $schema = true;
        $tipo = 'string';
        $vuoto = '';
        if ($config['type'] === 'number') {
            $tipo = 'number';
            $vuoto = 0;
        } elseif ($config['type'] === 'repeater') {
            $tipo = 'array';
            $vuoto = array();
            $proprieta = array();
            foreach ($config['sub_fields'] as $sotto => $c) {
                $proprieta[$sotto] = array('type' => 'string');
            }
            $schema = array('schema' => array('type' => 'array', 'items' => array(
                'type' => 'object', 'properties' => $proprieta, 'additionalProperties' => false,
            )));
        }
        register_post_meta('post', $chiave, array(
            'type'          => $tipo,
            'single'        => true,
            'default'       => $vuoto,
            'show_in_rest'  => $schema,
            'auth_callback' => function () {
                return current_user_can('edit_posts');
            },
        ));
    }
}, 11);

// NB dal riferimento: l'elenco delle rotte REST NON va filtrato a mano (`rest_endpoints`): un
// filtro cosi' ha mandato in errore fatale tutta la REST API.
