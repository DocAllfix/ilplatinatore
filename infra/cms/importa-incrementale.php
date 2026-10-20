<?php
/**
 * Importazione incrementale da Aruba (Fase 6): applica sul CMS il pacchetto preparato da
 * scripts/importa/incrementale.py. Si lancia SOLO da quello script:
 *
 *   wp eval-file /incrementale/importa-incrementale.php /incrementale/pacchetto.json
 *
 * Regole:
 * - gli ID di Aruba si conservano (link brevi /?p=, immagini in evidenza): import_id;
 * - date di pubblicazione E di modifica identiche ad Aruba (sitemap, Yoast, home per modifica);
 * - i campi del prototipo (pl_*) del CMS di lavoro non si toccano mai: Aruba non li ha;
 * - le descrizioni dei tag non si sovrascrivono (contengono le righe della scheda del gioco);
 * - nessuna revisione durante l importazione, contenuto senza filtri (iframe e incorporamenti
 *   restano come su Aruba).
 */

if (!defined('WP_CLI')) {
    exit(1);
}

$file = $args[0] ?? '';
$pacchetto = json_decode((string) file_get_contents($file), true);
if (!is_array($pacchetto)) {
    WP_CLI::error('pacchetto illeggibile: ' . $file);
}

global $wpdb;

// gli ID creati dal CMS (revisioni, prove, bozze di anteprima) non devono mai occupare quelli che
// Aruba usera: da qui in poi il CMS conta da 100000
$auto = (int) $wpdb->get_var($wpdb->prepare(
    'SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = %s AND table_name = %s',
    DB_NAME,
    $wpdb->posts
));
if ($auto < 100000) {
    $wpdb->query("ALTER TABLE {$wpdb->posts} AUTO_INCREMENT = 100000");
    WP_CLI::log('contatore degli ID del CMS portato a 100000');
}

$amministratore = get_users(array('role' => 'administrator', 'number' => 1, 'orderby' => 'ID'));
wp_set_current_user($amministratore ? $amministratore[0]->ID : 1);
kses_remove_filters();
add_filter('wp_revisions_to_keep', '__return_zero');

$dominio_cms = untrailingslashit(home_url());
$sostituisci = function ($testo) use ($dominio_cms) {
    return str_replace(array('https://www.ilplatinatore.it', 'https://ilplatinatore.it'), $dominio_cms, (string) $testo);
};

// --- termini ----------------------------------------------------------------------------------
$termini = array(); // "tassonomia:slug" => term_id sul CMS
foreach ($pacchetto['termini_nuovi'] as $t) {
    $genitore = 0;
    if (!empty($t['genitore'])) {
        $g = get_term_by('slug', $t['genitore'], $t['tassonomia']);
        $genitore = $g ? $g->term_id : 0;
    }
    $r = wp_insert_term($t['nome'], $t['tassonomia'], array(
        'slug'        => $t['slug'],
        'description' => $t['descrizione'],
        'parent'      => $genitore,
    ));
    if (is_wp_error($r)) {
        WP_CLI::warning('termine ' . $t['tassonomia'] . ' ' . $t['slug'] . ': ' . $r->get_error_message());
        continue;
    }
    WP_CLI::log('termine creato: ' . $t['tassonomia'] . ' ' . $t['slug']);
}
$id_termine = function ($tassonomia, $slug) use (&$termini) {
    $k = $tassonomia . ':' . $slug;
    if (!isset($termini[$k])) {
        $t = get_term_by('slug', $slug, $tassonomia);
        $termini[$k] = $t ? (int) $t->term_id : 0;
    }
    return $termini[$k];
};

// --- immagini ---------------------------------------------------------------------------------
foreach ($pacchetto['media_nuovi'] as $m) {
    if (get_post($m['id'])) {
        continue;
    }
    $id = wp_insert_attachment(wp_slash(array(
        'import_id'      => $m['id'],
        'post_title'     => $m['titolo'],
        'post_excerpt'   => $m['didascalia'],
        'post_content'   => $m['descrizione'],
        'post_mime_type' => $m['mime'],
        'post_author'    => $m['autore'],
        'post_date'      => $m['data'],
        'post_date_gmt'  => $m['data_gmt'],
        'post_name'      => $m['slug'],
        'guid'           => $dominio_cms . '/wp-content/uploads/' . $m['file'],
    )), false, (int) $m['genitore'], true);
    if (is_wp_error($id) || (int) $id !== (int) $m['id']) {
        WP_CLI::warning('immagine ' . $m['id'] . ' non creata con lo stesso ID');
        continue;
    }
    update_post_meta($id, '_wp_attached_file', $m['file']);
    wp_update_attachment_metadata($id, $m['metadati']);
    if ($m['alt'] !== '') {
        update_post_meta($id, '_wp_attachment_image_alt', wp_slash($m['alt']));
    }
    $wpdb->update($wpdb->posts, array('post_modified' => $m['modifica'], 'post_modified_gmt' => $m['modifica_gmt']), array('ID' => $id));
    clean_post_cache($id);
}
WP_CLI::log('immagini nuove: ' . count($pacchetto['media_nuovi']));

// --- articoli e pagine ------------------------------------------------------------------------
$fatti = array('creati' => 0, 'aggiornati' => 0);
foreach ($pacchetto['articoli'] as $a) {
    $esiste = get_post($a['id']);
    if (!empty($a['solo_data']) && $esiste) {
        $wpdb->update($wpdb->posts, array('post_modified' => $a['modifica'], 'post_modified_gmt' => $a['modifica_gmt']), array('ID' => $a['id']));
        clean_post_cache($a['id']);
        $fatti['aggiornati']++;
        continue;
    }
    $dati = array(
        'post_type'      => $a['tipo'],
        'post_title'     => $a['titolo'],
        'post_content'   => $sostituisci($a['contenuto']),
        'post_excerpt'   => $a['riassunto'],
        'post_name'      => $a['slug'],
        'post_status'    => $a['stato'],
        'post_author'    => $a['autore'],
        'post_date'      => $a['data'],
        'post_date_gmt'  => $a['data_gmt'],
        'comment_status' => $a['commenti'],
        'ping_status'    => $a['ping'],
        'post_password'  => $a['password'],
    );
    if ($esiste) {
        $dati['ID'] = $a['id'];
        // le date di WordPress: senza edit_date una bozza perderebbe la data scelta
        $dati['edit_date'] = true;
        $id = wp_update_post(wp_slash($dati), true);
    } else {
        $dati['import_id'] = $a['id'];
        $id = wp_insert_post(wp_slash($dati), true);
    }
    if (is_wp_error($id) || (int) $id !== (int) $a['id']) {
        WP_CLI::warning($a['tipo'] . ' ' . $a['id'] . ' (' . $a['slug'] . '): ' . (is_wp_error($id) ? $id->get_error_message() : 'ID diverso ' . $id));
        continue;
    }

    if ($a['tipo'] === 'post') {
        wp_set_object_terms($id, array_values(array_filter(array_map(function ($s) use ($id_termine) {
            return $id_termine('category', $s);
        }, $a['categorie']))), 'category');
        wp_set_object_terms($id, array_values(array_filter(array_map(function ($s) use ($id_termine) {
            return $id_termine('post_tag', $s);
        }, $a['tag']))), 'post_tag');
        if ($a['in_evidenza']) {
            stick_post($id);
        } else {
            unstick_post($id);
        }
        set_post_format($id, $a['formato'] === 'standard' ? false : $a['formato']);
    }

    if ($a['immagine']) {
        set_post_thumbnail($id, $a['immagine']);
    } else {
        delete_post_thumbnail($id);
    }
    // i campi che Aruba espone (Yoast, note), piu quelli che Yoast calcola e la REST non mostra
    foreach ($a['meta'] as $k => $v) {
        if (strpos($k, 'pl_') === 0) {
            continue;
        }
        update_post_meta($id, $k, wp_slash($v));
    }
    if (!empty($a['categoria_principale'])) {
        $c = $id_termine('category', $a['categoria_principale']);
        if ($c) {
            update_post_meta($id, '_yoast_wpseo_primary_category', $c);
        }
    }
    // uno slug o una data cambiati su un articolo pubblicato: WordPress salva da solo _wp_old_slug e
    // _wp_old_date (wp_check_for_changed_slugs), e il sito rimanda con un 301

    $wpdb->update($wpdb->posts, array('post_modified' => $a['modifica'], 'post_modified_gmt' => $a['modifica_gmt']), array('ID' => $id));
    clean_post_cache($id);
    $fatti[$esiste ? 'aggiornati' : 'creati']++;
}

WP_CLI::success('articoli e pagine creati: ' . $fatti['creati'] . ', aggiornati: ' . $fatti['aggiornati']);
