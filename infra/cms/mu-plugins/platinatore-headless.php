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

/* ---------------------------------------------------------------------------------------
 * 6. HUB DEL GIOCO: CAMPI DEL TAG (PDF 04, piano 04)
 *
 * Non tutti i tag sono giochi (00-raccordo, punto 4): l'hub compare solo dove `pl_gioco` vale 1.
 * Campi del termine, nativi (wpvibe non ha campi per i termini): leggibili e scrivibili dalla
 * REST (`meta` del tag) e modificabili nella pagina del tag in wp-admin.
 * ------------------------------------------------------------------------------------- */

function platinatore_campi_gioco()
{
    return array(
        'pl_gioco'          => array('label' => 'È un gioco (hub)', 'tipo' => 'si'),
        'pl_sezioni'        => array('label' => 'Sezioni della home', 'aiuto' => 'Chiavi separate da virgola, per esempio «classico» o «indie»: tutti gli articoli del gioco entrano in quella sezione della home.'),
        'pl_sfida'          => array('label' => 'Usabile nella sfida', 'tipo' => 'si', 'aiuto' => 'Il gioco può uscire in «Riconosci il gioco», con la foto della sua guida più recente. Non accende la pagina hub.'),
        'pl_presentazione'  => array('label' => 'Presentazione breve', 'tipo' => 'area', 'aiuto' => 'Due o tre frasi: che gioco è e cosa trova qui chi lo gioca.'),
        'pl_piattaforme'    => array('label' => 'Piattaforme', 'aiuto' => 'Separate da virgola: «PS5, Xbox Series X|S, PC».'),
        'pl_uscita'         => array('label' => 'Data di uscita', 'aiuto' => 'AAAA-MM-GG.'),
        'pl_sviluppatore'   => array('label' => 'Sviluppatore'),
        'pl_editore'        => array('label' => 'Editore'),
        'pl_guida_platino'  => array('label' => 'Guida al Platino', 'aiuto' => 'Slug dell\'articolo. Da qui l\'hub prende i dati del completamento e la copertina.'),
        'pl_inizia_qui'     => array('label' => 'Inizia qui', 'tipo' => 'area', 'aiuto' => 'Slug degli articoli, uno per riga, nell\'ordine in cui leggerli.'),
    );
}

add_action('init', function () {
    foreach (platinatore_campi_gioco() as $chiave => $c) {
        register_term_meta('post_tag', $chiave, array(
            'type'          => 'string',
            'single'        => true,
            'default'       => '',
            'show_in_rest'  => true,
            'auth_callback' => function () {
                return current_user_can('manage_categories');
            },
        ));
    }
});

add_action('post_tag_edit_form_fields', function ($termine) {
    wp_nonce_field('platinatore_gioco', 'platinatore_gioco_nonce');
    echo '<tr><th colspan="2"><h2>Hub del gioco</h2></th></tr>';
    foreach (platinatore_campi_gioco() as $chiave => $c) {
        $valore = get_term_meta($termine->term_id, $chiave, true);
        $tipo = isset($c['tipo']) ? $c['tipo'] : 'testo';
        echo '<tr class="form-field"><th scope="row"><label for="' . esc_attr($chiave) . '">' . esc_html($c['label']) . '</label></th><td>';
        if ($tipo === 'si') {
            echo '<input type="checkbox" id="' . esc_attr($chiave) . '" name="' . esc_attr($chiave) . '" value="1"' . checked($valore, '1', false) . '>';
        } elseif ($tipo === 'area') {
            echo '<textarea id="' . esc_attr($chiave) . '" name="' . esc_attr($chiave) . '" rows="4">' . esc_textarea($valore) . '</textarea>';
        } else {
            echo '<input type="text" id="' . esc_attr($chiave) . '" name="' . esc_attr($chiave) . '" value="' . esc_attr($valore) . '">';
        }
        if (!empty($c['aiuto'])) {
            echo '<p class="description">' . esc_html($c['aiuto']) . '</p>';
        }
        echo '</td></tr>';
    }
});

add_action('edited_post_tag', function ($id) {
    if (!isset($_POST['platinatore_gioco_nonce']) || !wp_verify_nonce($_POST['platinatore_gioco_nonce'], 'platinatore_gioco')) {
        return;
    }
    if (!current_user_can('manage_categories')) {
        return;
    }
    foreach (platinatore_campi_gioco() as $chiave => $c) {
        $tipo = isset($c['tipo']) ? $c['tipo'] : 'testo';
        if ($tipo === 'si') {
            update_term_meta($id, $chiave, empty($_POST[$chiave]) ? '' : '1');
        } elseif (isset($_POST[$chiave])) {
            $v = wp_unslash($_POST[$chiave]);
            update_term_meta($id, $chiave, $tipo === 'area' ? sanitize_textarea_field($v) : sanitize_text_field($v));
        }
    }
});

// Un tag modificato (nome, descrizione o campi del gioco, da wp-admin o dalla REST) rigenera l'hub.
function platinatore_avvisa_hub($id)
{
    if (!defined('PLATINATORE_SITO_PUBBLICO') || !defined('PLATINATORE_REVALIDATE_TOKEN')) {
        return;
    }
    $t = get_term($id, 'post_tag');
    if (!$t || is_wp_error($t)) {
        return;
    }
    $r = wp_remote_post(rtrim(PLATINATORE_SITO_PUBBLICO, '/') . '/api/revalidate/', array(
        'timeout'  => 3,
        'blocking' => true,
        'headers'  => array('Content-Type' => 'application/json', 'x-cms-token' => PLATINATORE_REVALIDATE_TOKEN),
        'body'     => wp_json_encode(array('tag' => array($t->slug))),
    ));
    if (is_wp_error($r) || wp_remote_retrieve_response_code($r) !== 200) {
        error_log('[platinatore] webhook non riuscito per il tag ' . $t->slug);
    }
}
// priorita' 20: dopo il salvataggio dei campi qui sopra
add_action('edited_post_tag', 'platinatore_avvisa_hub', 20);
// dalla REST i meta si salvano dopo edited_term: si avvisa a lavoro finito
add_action('rest_after_insert_post_tag', function ($t) {
    platinatore_avvisa_hub($t->term_id);
});

/* ---------------------------------------------------------------------------------------
 * 7. SFIDA: ELENCO DEI CLASSICI (PDF 08, piano 05)
 *
 * «Riconosci il classico» si gioca a indizi (anno, piattaforme, sviluppatore, genere, serie), senza
 * immagini: nessun problema di diritti. L'elenco sta in un'opzione, modificabile in Strumenti >
 * Classici della sfida, una riga per gioco:
 *   Nome | anno | piattaforme separate da virgola | sviluppatore | genere | serie (facoltativa)
 * Il sito lo legge da una rotta REST pubblica (non rivela nulla che non sia gia' nel gioco).
 * ------------------------------------------------------------------------------------- */

function platinatore_classici()
{
    $righe = preg_split('/\r?\n/', (string) get_option('platinatore_classici', ''));
    $out = array();
    foreach ($righe as $riga) {
        $c = array_map('trim', explode('|', $riga));
        if (count($c) < 5 || $c[0] === '' || !preg_match('/^\d{4}$/', $c[1])) {
            continue;
        }
        $out[] = array(
            'nome'         => $c[0],
            'anno'         => (int) $c[1],
            'piattaforme'  => array_values(array_filter(array_map('trim', explode(',', $c[2])))),
            'sviluppatore' => $c[3],
            'genere'       => $c[4],
            'serie'        => isset($c[5]) ? $c[5] : '',
        );
    }
    return $out;
}

add_action('rest_api_init', function () {
    register_rest_route('platinatore/v1', '/classici', array(
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'callback'            => function () {
            return rest_ensure_response(platinatore_classici());
        },
    ));
});

add_action('admin_menu', function () {
    add_management_page('Classici della sfida', 'Classici della sfida', 'edit_others_posts', 'platinatore-classici', function () {
        if (isset($_POST['platinatore_classici']) && check_admin_referer('platinatore_classici')) {
            update_option('platinatore_classici', sanitize_textarea_field(wp_unslash($_POST['platinatore_classici'])), false);
            echo '<div class="notice notice-success"><p>Salvato: ' . count(platinatore_classici()) . ' classici validi.</p></div>';
            // la sfida legge l'elenco: si avvisa il sito come per un articolo
            if (defined('PLATINATORE_SITO_PUBBLICO') && defined('PLATINATORE_REVALIDATE_TOKEN')) {
                wp_remote_post(rtrim(PLATINATORE_SITO_PUBBLICO, '/') . '/api/revalidate/', array(
                    'timeout' => 3, 'blocking' => true,
                    'headers' => array('Content-Type' => 'application/json', 'x-cms-token' => PLATINATORE_REVALIDATE_TOKEN),
                    'body'    => '{}',
                ));
            }
        }
        echo '<div class="wrap"><h1>Classici della sfida</h1>';
        echo '<p>Una riga per gioco: <code>Nome | anno | piattaforme separate da virgola | sviluppatore | genere | serie</code>. La serie è facoltativa. Le righe scritte male si ignorano.</p>';
        echo '<form method="post">';
        wp_nonce_field('platinatore_classici');
        echo '<textarea name="platinatore_classici" rows="30" class="large-text code">' . esc_textarea(get_option('platinatore_classici', '')) . '</textarea>';
        submit_button('Salva');
        echo '</form></div>';
    });
});

/* ---------------------------------------------------------------------------------------
 * 8. HOME A SEZIONI (PDF 01, 02, 09; piano 06, modello games.gg chiesto dal proprietario)
 *
 * Una decina di sezioni a tema, ciascuna una fila di news e guide ordinate per ultima modifica.
 * Nessuno sceglie gli articoli: entrano da soli secondo la regola della sezione. Elenco in
 * Strumenti > Sezioni della home, una riga per sezione:
 *   Titolo | regola | parametro
 * Regole: piu-letti (Search Console, 28 giorni) · giochi-momento (giorni) · tag-sezione (chiave,
 * es. classico o indie: i giochi segnati sul tag) · titolo (parole separate da virgola) ·
 * categoria (slug) · sfida · esplora-giochi (quanti). Il sito le legge da una rotta REST pubblica.
 * ------------------------------------------------------------------------------------- */

function platinatore_sezioni_home()
{
    $righe = preg_split('/\r?\n/', (string) get_option('platinatore_sezioni_home', ''));
    $regole = array('piu-letti', 'giochi-momento', 'tag-sezione', 'titolo', 'categoria', 'sfida', 'esplora-giochi', 'recensioni');
    $out = array();
    foreach ($righe as $riga) {
        $c = array_map('trim', explode('|', $riga));
        if (count($c) < 2 || $c[0] === '' || !in_array($c[1], $regole, true)) {
            continue;
        }
        $out[] = array('titolo' => $c[0], 'regola' => $c[1], 'parametro' => isset($c[2]) ? $c[2] : '');
    }
    return $out;
}

add_action('rest_api_init', function () {
    register_rest_route('platinatore/v1', '/home', array(
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'callback'            => function () {
            return rest_ensure_response(array('sezioni' => platinatore_sezioni_home()));
        },
    ));
});

add_action('admin_menu', function () {
    add_management_page('Sezioni della home', 'Sezioni della home', 'edit_others_posts', 'platinatore-home', function () {
        if (isset($_POST['platinatore_sezioni_home']) && check_admin_referer('platinatore_home')) {
            update_option('platinatore_sezioni_home', sanitize_textarea_field(wp_unslash($_POST['platinatore_sezioni_home'])), false);
            echo '<div class="notice notice-success"><p>Salvato: ' . count(platinatore_sezioni_home()) . ' sezioni valide.</p></div>';
            if (defined('PLATINATORE_SITO_PUBBLICO') && defined('PLATINATORE_REVALIDATE_TOKEN')) {
                wp_remote_post(rtrim(PLATINATORE_SITO_PUBBLICO, '/') . '/api/revalidate/', array(
                    'timeout' => 3, 'blocking' => true,
                    'headers' => array('Content-Type' => 'application/json', 'x-cms-token' => PLATINATORE_REVALIDATE_TOKEN),
                    'body'    => '{}',
                ));
            }
        }
        echo '<div class="wrap"><h1>Sezioni della home</h1>';
        echo '<p>Una riga per sezione, nell ordine in cui compaiono: <code>Titolo | regola | parametro</code>.</p>';
        echo '<ul style="list-style:disc;padding-left:2em"><li><code>piu-letti</code>: le guide più cliccate da Google negli ultimi 28 giorni.</li>';
        echo '<li><code>giochi-momento | 30</code>: gli articoli dei giochi con più uscite negli ultimi 30 giorni.</li>';
        echo '<li><code>tag-sezione | indie</code>: gli articoli dei giochi che hanno «indie» nel campo Sezioni della home del tag.</li>';
        echo '<li><code>titolo | enigma, soluzione</code>: gli articoli con una di queste parole nel titolo.</li>';
        echo '<li><code>categoria | news</code>: gli articoli della categoria. <code>sfida</code>: la sfida del giorno.</li>';
        echo '<li><code>esplora-giochi | 12</code>: le schede dei giochi con hub, verso le loro pagine.</li>';
        echo '<li><code>recensioni | 8</code>: le recensioni in vetrina, la piu recente in grande col voto.</li></ul>';
        echo '<form method="post">';
        wp_nonce_field('platinatore_home');
        echo '<textarea name="platinatore_sezioni_home" rows="14" class="large-text code">' . esc_textarea(get_option('platinatore_sezioni_home', '')) . '</textarea>';
        submit_button('Salva');
        echo '</form></div>';
    });
});

/* ---------------------------------------------------------------------------------------
 * 9. ADS.TXT (Fase 5)
 *
 * Oggi ads.txt lo gestisce Advanced Ads nelle sue impostazioni (opzione advanced_ads_ads_txt,
 * campo «custom»). Advanced Ads sul CMS headless resta spento (inietterebbe la pubblicita' nella
 * REST): il testo si legge da qui e il sito lo serve su /ads.txt, aggiornabile senza pubblicare.
 * ------------------------------------------------------------------------------------- */

/*
 * Dal 23/10/2026 il file si aggiorna da Strumenti > ads.txt (ogni nuovo partner di HB): si incolla
 * il file intero e si salva, il sito lo serve cosi com e entro pochi secondi. Finche quella pagina non
 * ha mai salvato niente vale il testo di Advanced Ads con la sua intestazione (gli stessi byte di oggi).
 */

/** Il file ads.txt completo, come il sito lo pubblica. Stringa vuota = nessun file valido. */
function platinatore_ads_txt()
{
    $file = get_option('platinatore_ads_txt', '');
    if (is_string($file) && trim($file) !== '') {
        return $file;
    }
    $o = get_option('advanced_ads_ads_txt', array());
    $testo = is_array($o) && isset($o['custom']) ? (string) $o['custom'] : '';
    return trim($testo) === '' ? '' : "# Advanced Ads ads.txt\n" . $testo . "\n";
}

/**
 * Salva il file com e, senza le pulizie di WordPress (toglierebbero caratteri): solo gli a-capo di
 * Windows diventano di Unix, via il BOM, un solo a-capo in fondo. Vuoto = non si salva.
 */
function platinatore_salva_ads_txt($testo)
{
    $testo = str_replace(array("\r\n", "\r"), "\n", (string) $testo);
    if (strncmp($testo, "\xEF\xBB\xBF", 3) === 0) {
        $testo = substr($testo, 3);
    }
    $testo = rtrim($testo);
    if (trim($testo) === '') {
        return false;
    }
    update_option('platinatore_ads_txt', $testo . "\n", false);
    return true;
}

add_action('rest_api_init', function () {
    register_rest_route('platinatore/v1', '/ads-txt', array(
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'callback'            => function () {
            $file = platinatore_ads_txt();
            if ($file === '') {
                // mai un ads.txt vuoto: il sito tiene l ultima versione buona
                return new WP_Error('ads_txt_vuoto', 'ads.txt vuoto', array('status' => 503));
            }
            $o = get_option('advanced_ads_ads_txt', array());
            return rest_ensure_response(array(
                'file'  => $file,
                'testo' => is_array($o) && isset($o['custom']) ? (string) $o['custom'] : '',
            ));
        },
    ));
});

function platinatore_pagina_ads_txt()
{
    if (isset($_POST['platinatore_ads_txt']) && check_admin_referer('platinatore_ads_txt')) {
        if (platinatore_salva_ads_txt(wp_unslash($_POST['platinatore_ads_txt']))) {
            if (defined('PLATINATORE_SITO_PUBBLICO') && defined('PLATINATORE_REVALIDATE_TOKEN')) {
                wp_remote_post(rtrim(PLATINATORE_SITO_PUBBLICO, '/') . '/api/revalidate/', array(
                    'timeout' => 3, 'blocking' => true,
                    'headers' => array('Content-Type' => 'application/json', 'x-cms-token' => PLATINATORE_REVALIDATE_TOKEN),
                    'body'    => '{}',
                ));
            }
            echo '<div class="notice notice-success"><p>Salvato. Il sito pubblica il nuovo ads.txt entro pochi secondi.</p></div>';
        } else {
            echo '<div class="notice notice-error"><p>Il file e vuoto: non salvato. Il sito continua a pubblicare quello di prima.</p></div>';
        }
    }
    $file = platinatore_ads_txt();
    $righe = $file === '' ? 0 : substr_count($file, "\n");
    echo '<div class="wrap"><h1>ads.txt</h1>';
    echo '<p>Il file che il sito pubblica su <code>/ads.txt</code> (' . intval($righe) . ' righe). Quando HB Agency manda una nuova versione: incolla qui il file intero al posto di quello vecchio, oppure aggiungi le righe nuove, e salva.</p>';
    echo '<p>Si salva esattamente cio che e scritto qui. Un file vuoto non si salva.</p>';
    echo '<form method="post">';
    wp_nonce_field('platinatore_ads_txt');
    echo '<textarea name="platinatore_ads_txt" rows="30" class="large-text code" spellcheck="false">' . esc_textarea($file) . '</textarea>';
    submit_button('Salva');
    echo '</form></div>';
}

add_action('admin_menu', function () {
    add_management_page('ads.txt', 'ads.txt', 'manage_options', 'platinatore-ads-txt', 'platinatore_pagina_ads_txt');
});

/* ---------------------------------------------------------------------------------------
 * 10. REGISTRO DEGLI HUB (approvato dal proprietario il 20/10/2026)
 *
 * Ogni tag e' l'hub del suo gioco, tranne gli esclusi; le sezioni dell'hub nascono dalle parole
 * dei titoli. Il testo si scrive in Strumenti > Registro degli hub e il sito lo legge da qui
 * (lettura e regole in src/lib/registro-hub.ts). Testo di partenza: infra/cms/registro-hub.txt.
 * ------------------------------------------------------------------------------------- */

add_action('rest_api_init', function () {
    register_rest_route('platinatore/v1', '/registro-hub', array(
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'callback'            => function () {
            return rest_ensure_response(array('testo' => (string) get_option('platinatore_registro_hub', '')));
        },
    ));
});

add_action('admin_menu', function () {
    add_management_page('Registro degli hub', 'Registro degli hub', 'edit_others_posts', 'platinatore-registro-hub', function () {
        if (isset($_POST['platinatore_registro_hub']) && check_admin_referer('platinatore_registro_hub')) {
            update_option('platinatore_registro_hub', sanitize_textarea_field(wp_unslash($_POST['platinatore_registro_hub'])), false);
            echo '<div class="notice notice-success"><p>Salvato. Gli hub si aggiornano in pochi secondi.</p></div>';
            if (defined('PLATINATORE_SITO_PUBBLICO') && defined('PLATINATORE_REVALIDATE_TOKEN')) {
                wp_remote_post(rtrim(PLATINATORE_SITO_PUBBLICO, '/') . '/api/revalidate/', array(
                    'timeout' => 3, 'blocking' => true,
                    'headers' => array('Content-Type' => 'application/json', 'x-cms-token' => PLATINATORE_REVALIDATE_TOKEN),
                    'body'    => '{}',
                ));
            }
        }
        echo '<div class="wrap"><h1>Registro degli hub</h1>';
        echo '<p>Ogni tag diventa la pagina del suo gioco (hub), tranne quelli in <code>Esclusi</code>. Le sezioni dell hub nascono dai titoli degli articoli.</p>';
        echo '<ul style="list-style:disc;padding-left:2em">';
        echo '<li>Una sezione per riga: <code>Nome: parola, parola, parola</code>. L ordine conta: un articolo va nella prima sezione che combacia.</li>';
        echo '<li>Una parola che finisce con <code>*</code> vale con qualunque finale: <code>collezionabil*</code> vale per collezionabile e collezionabili. Maiuscole e accenti non contano.</li>';
        echo '<li><code>Generico: nome</code> e la sezione per i titoli che non combaciano con niente, sempre per ultima.</li>';
        echo '<li><code>Esclusi: slug, slug</code> sono i tag che non sono giochi: restano archivi normali.</li>';
        echo '<li>Le righe che iniziano con <code>#</code> sono note.</li></ul>';
        echo '<form method="post">';
        wp_nonce_field('platinatore_registro_hub');
        echo '<textarea name="platinatore_registro_hub" rows="20" class="large-text code">' . esc_textarea(get_option('platinatore_registro_hub', '')) . '</textarea>';
        submit_button('Salva');
        echo '</form></div>';
    });
});

/* ---------------------------------------------------------------------------------------
 * 11. RECENSIONI: IL VOTO (richiesta del proprietario, 20/10/2026)
 *
 * Lo shortcode [platinatore_voto valore="7.5" scala="10"] produce lo STESSO HTML del sito su Aruba
 * (contenuto identico, verifica di parita'); il sito lo trasforma nella scheda del verdetto. A ogni
 * salvataggio il voto si copia nei campi pl_voto e pl_voto_scala: schede, home e hub lo leggono
 * dalla REST senza aprire il testo.
 * ------------------------------------------------------------------------------------- */

function platinatore_numero_voto($v)
{
    $v = str_replace(',', '.', trim((string) $v));
    return is_numeric($v) ? (float) $v : null;
}

add_shortcode('platinatore_voto', function ($attributi) {
    $a = shortcode_atts(array('valore' => '', 'scala' => '10'), $attributi);
    $valore = platinatore_numero_voto($a['valore']);
    $scala = platinatore_numero_voto($a['scala']);
    if ($valore === null || !$scala) {
        return '';
    }
    $testo = str_replace('.', ',', (string) $valore);
    $testo_scala = str_replace('.', ',', (string) $scala);
    return '<div class="platinatore-voto" role="img" aria-label="Voto ' . esc_attr($testo) . ' su ' . esc_attr($testo_scala) . '">'
        . '<span class="platinatore-voto__numero">' . esc_html($testo) . '</span>'
        . '<span class="platinatore-voto__scala">/' . esc_html($testo_scala) . '</span></div>';
});

add_action('init', function () {
    foreach (array('pl_voto', 'pl_voto_scala') as $chiave) {
        register_post_meta('post', $chiave, array(
            'type'          => 'string',
            'single'        => true,
            'show_in_rest'  => true,
            'auth_callback' => function () {
                return current_user_can('edit_posts');
            },
        ));
    }
});

/** Copia il voto dello shortcode nei campi; senza shortcode li toglie. */
function platinatore_salva_voto($id)
{
    $post = get_post($id);
    if (!$post || $post->post_type !== 'post' || wp_is_post_revision($id)) {
        return;
    }
    if (preg_match('/\[platinatore_voto\s([^\]]*)\]/', $post->post_content, $m)) {
        $a = shortcode_parse_atts($m[1]);
        $valore = platinatore_numero_voto(isset($a['valore']) ? $a['valore'] : '');
        $scala = platinatore_numero_voto(isset($a['scala']) ? $a['scala'] : '10');
        if ($valore !== null && $scala) {
            update_post_meta($id, 'pl_voto', (string) $valore);
            update_post_meta($id, 'pl_voto_scala', (string) $scala);
            return;
        }
    }
    delete_post_meta($id, 'pl_voto');
    delete_post_meta($id, 'pl_voto_scala');
}
// priorita' bassa: i campi sono pronti prima dell avviso al sito (rest_after_insert_post)
add_action('save_post_post', 'platinatore_salva_voto', 5);

/* ---------------------------------------------------------------------------------------
 * 12. LA PAROLA (gioco 4, Wordle sui videogiochi, 21/10/2026)
 *
 * Livello facile: i nomi dei giochi, presi dagli hub dal sito. Medio (software house) e difficile
 * (boss): questo elenco, una riga per parola «livello | parola | slug del gioco». Il sito lo legge
 * da qui (lettura e regole in src/lib/parola.ts). Testo di partenza: infra/cms/parole-sfida.txt.
 * ------------------------------------------------------------------------------------- */

add_action('rest_api_init', function () {
    register_rest_route('platinatore/v1', '/parole', array(
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'callback'            => function () {
            return rest_ensure_response(array('testo' => (string) get_option('platinatore_parole_sfida', '')));
        },
    ));
});

add_action('admin_menu', function () {
    add_management_page('Parole della sfida', 'Parole della sfida', 'edit_others_posts', 'platinatore-parole', function () {
        if (isset($_POST['platinatore_parole_sfida']) && check_admin_referer('platinatore_parole')) {
            update_option('platinatore_parole_sfida', sanitize_textarea_field(wp_unslash($_POST['platinatore_parole_sfida'])), false);
            echo '<div class="notice notice-success"><p>Salvato. Le parole di domani terranno conto delle modifiche.</p></div>';
            if (defined('PLATINATORE_SITO_PUBBLICO') && defined('PLATINATORE_REVALIDATE_TOKEN')) {
                wp_remote_post(rtrim(PLATINATORE_SITO_PUBBLICO, '/') . '/api/revalidate/', array(
                    'timeout' => 3, 'blocking' => true,
                    'headers' => array('Content-Type' => 'application/json', 'x-cms-token' => PLATINATORE_REVALIDATE_TOKEN),
                    'body'    => '{}',
                ));
            }
        }
        echo '<div class="wrap"><h1>Parole della sfida</h1>';
        echo '<p>Il gioco «La parola»: una parola al giorno per livello. Il livello facile usa da solo i nomi dei giochi degli hub.</p>';
        echo '<ul style="list-style:disc;padding-left:2em">';
        echo '<li>Una parola per riga: <code>medio | Remedy | control-resonant</code> (software house) oppure <code>difficile | Hedron | control-resonant</code> (boss).</li>';
        echo '<li>Livello facile: esce da solo il nome del gioco dell hub. Se il nome non si puo giocare (oltre 14 lettere, cifre, due punti) si scrive il nome breve: <code>facile | Wukong | black-myth-wukong</code>.</li>';
        echo '<li>Il terzo campo e lo slug del gioco: alla fine della partita si propone il suo hub.</li>';
        echo '<li>Al massimo 14 lettere (spazi, trattini e apostrofi non contano), niente cifre. Le righe che iniziano con <code>#</code> sono note.</li></ul>';
        echo '<form method="post">';
        wp_nonce_field('platinatore_parole');
        echo '<textarea name="platinatore_parole_sfida" rows="24" class="large-text code">' . esc_textarea(get_option('platinatore_parole_sfida', '')) . '</textarea>';
        submit_button('Salva');
        echo '</form></div>';
    });
});

// NB dal riferimento: l'elenco delle rotte REST NON va filtrato a mano (`rest_endpoints`): un
// filtro cosi' ha mandato in errore fatale tutta la REST API.

/* ---------------------------------------------------------------------------------------
 * 13. IMMAGINI DELLE SITEMAP (22/10/2026)
 *
 * Le sitemap degli articoli di oggi (Yoast) elencano per ogni articolo l immagine in evidenza e
 * quelle del testo: e cosi che Google Immagini le trova. Il sito le ricostruisce con lo STESSO
 * analizzatore di Yoast (WPSEO_Sitemap_Image_Parser), quindi stesse immagini e stesso ordine.
 * Il calcolo legge il testo di tutti gli articoli: si conserva e si rifa solo quando un articolo
 * viene salvato o eliminato. Risposta: { "id articolo": ["indirizzo", ...] } (indirizzi del CMS,
 * il sito li riporta sul dominio pubblico).
 * ------------------------------------------------------------------------------------- */

function platinatore_immagini_sitemap()
{
    $salvate = get_transient('platinatore_immagini_sitemap');
    if (is_array($salvate)) {
        return $salvate;
    }
    if (!class_exists('WPSEO_Sitemap_Image_Parser')) {
        return null;
    }
    $parser = new WPSEO_Sitemap_Image_Parser();
    $ids = get_posts(array(
        'post_type'      => 'post',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'fields'         => 'ids',
        'no_found_rows'  => true,
    ));
    $tutte = array();
    foreach ($ids as $id) {
        $post = get_post($id);
        $elenco = array();
        foreach ($parser->get_images($post) as $immagine) {
            if (!empty($immagine['src'])) {
                $elenco[] = $immagine['src'];
            }
        }
        if ($elenco) {
            $tutte[(string) $id] = array_values($elenco);
        }
    }
    set_transient('platinatore_immagini_sitemap', $tutte, DAY_IN_SECONDS);
    return $tutte;
}

add_action('save_post', function () {
    delete_transient('platinatore_immagini_sitemap');
});
add_action('deleted_post', function () {
    delete_transient('platinatore_immagini_sitemap');
});

add_action('rest_api_init', function () {
    register_rest_route('platinatore/v1', '/immagini-sitemap', array(
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'callback'            => function () {
            $tutte = platinatore_immagini_sitemap();
            if ($tutte === null) {
                return new WP_Error('yoast_assente', 'Analizzatore delle immagini di Yoast non disponibile', array('status' => 503));
            }
            return rest_ensure_response((object) $tutte);
        },
    ));
});
