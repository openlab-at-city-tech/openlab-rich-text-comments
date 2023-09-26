<?php
/**
 * Plugin Name: OpenLab Rich-Text Comments
 * Description: Rich-Text comments for posts and pages.
 * Author: OpenLab
 * Author URI: http://openlab.citytech.cuny.edu
 * Plugin URI: http://openlab.citytech.cuny.edu
 * Version: 1.0.0
 * License: GPL-2.0-or-later
 * Text Domain: openlab-rich-text-comments
 * Domain Path: /languages
 */

namespace OpenLab\RichTextComments;

const VERSION = '1.0.0';
const PLUGIN_FILE = __FILE__;

/**
 * Load the plugin textdomain.
 */
function load_textdomain() {
	load_plugin_textdomain( 'openlab-rich-text-comments' );
}
add_action( 'init', __NAMESPACE__ . '\\load_textdomain' );

/**
 * Register our assets.
 *
 * @return void
 */
function register_assets() {
	wp_register_style(
		'quill-style',
		plugins_url( 'assets/css/quill.snow.css' , __FILE__ ),
		[],
		'1.3.6'
	);

	wp_register_style(
		'ol-rich-text-comments',
		plugins_url( 'assets/css/rich-text-editor.css' , __FILE__ ),
		[ 'quill-style' ],
		VERSION
	);

	wp_register_script(
		'quill-script',
		plugins_url( 'assets/js/quill.min.js', __FILE__ ),
		[ 'jquery' ],
		'1.3.6',
		true
	);

	wp_register_script(
		'ol-rich-text-comments',
		plugins_url( 'assets/js/rich-text-editor.js', __FILE__ ),
		[ 'quill-script' ],
		VERSION,
		true
	);

	wp_localize_script(
		'ol-rich-text-comments',
		'OLRichTextComments',
		[
			'commentFieldIsRequired' => __( 'The comment field is required.', 'openlab-rich-text-comments' ),
			'embedUrl'               => __( 'Embed URL', 'openlab-rich-text-comments' ),
			'enterAltText'           => __( 'Alt text description', 'openlab-rich-text-comments' ),
			'enterMediaUrl'          => __( 'Enter media URL', 'openlab-rich-text-comments' ),
			'toggleBoldText'         => __( 'Toggle bold text', 'openlab-rich-text-comments' ),
			'toggleBulletedList'     => __( 'Toggle bulleted list', 'openlab-rich-text-comments' ),
			'toggleItalicText'       => __( 'Toggle italic text', 'openlab-rich-text-comments' ),
			'toggleLinkModal'        => __( 'Toggle link modal', 'openlab-rich-text-comments' ),
			'toggleMultimediaModal'  => __( 'Toggle multimedia modal', 'openlab-rich-text-comments' ),
			'toggleOrderedList'      => __( 'Toggle ordered list', 'openlab-rich-text-comments' ),
			'toggleUnderlineText'    => __( 'Toggle underline text', 'openlab-rich-text-comments' ),
		]
	);
}
add_action( 'wp_enqueue_scripts', __NAMESPACE__ . '\\register_assets' );

/**
 * Modify the HTML of the comment field to include the div element
 * needed for the Quill editor.
 *
 * @param  array $args
 * @return array $args
 */
function rich_text_comment_form( $args ) {
	$args['comment_field'] = str_replace( '<textarea', '<div id="ol-rich-editor" style="height: 150px;"></div><textarea style="display:none;"', $args['comment_field'] );

	wp_enqueue_style( 'ol-rich-text-comments' );
	wp_enqueue_script( 'ol-rich-text-comments' );

	return $args;
}
add_filter( 'comment_form_defaults', __NAMESPACE__ . '\\rich_text_comment_form', 20 );

/**
 * Sanitize comment content with allowed HTML KSES rules.
 *
 * @param  string $content Content to filter
 * @return string Filtered content.
 */
function kses_filter_comment( $content ) {
	// Remove default kses filters
	remove_filter( 'pre_comment_content', 'wp_filter_kses' );
	remove_filter( 'pre_comment_content', 'wp_filter_post_kses' );

	// List of allowed tags in the comments
	$allowedTags = array(
		'p'			=> array(),
		'b'			=> array(),
		'strong'	=> array(),
		'i'			=> array(),
		'em'		=> array(),
		'u'			=> array(),
		'a'			=> array(
			'href'	=> array(),
			'title'	=> array(),
		),
		'ol'		=> array(),
		'ul'		=> array(),
		'li'		=> array(),
		'img'		=> array(
			'src'		=> array(),
			'alt'		=> array(),
			'width'		=> array(),
			'height'	=> array()
		)
	);

	return wp_kses( $content, $allowedTags );
}
add_filter( 'pre_comment_content', __NAMESPACE__ . '\\kses_filter_comment', 1 );
