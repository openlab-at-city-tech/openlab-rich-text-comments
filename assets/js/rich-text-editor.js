'use strict';
(function($) {

    $(document).ready( function() {
			var BaseImageFormat = Quill.import('formats/image');
			var SnowTheme = Quill.import('themes/snow');

			class CustomImageFormat extends BaseImageFormat {
				static formats(domNode) {
					return {
						alt: domNode.getAttribute('alt')
					};
				}

				format(name, value) {
					if (name === 'alt') {
						this.domNode.setAttribute('alt', value);
					} else {
						super.format(name, value);
					}
				}
			}

			class CustomSnowTheme extends SnowTheme {
				extendToolbar(toolbar) {
					super.extendToolbar(toolbar);
					var imageButton = toolbar.container.querySelector('button.ql-image');
					if (imageButton) {
						imageButton.innerHTML = 'Image';
						imageButton.addEventListener('click', () => {
							setTimeout(() => {
								// Insert alt text input if it doesn't exist.
								var tooltip = document.querySelector( '.ql-editing' );
								if ( tooltip && ! tooltip.querySelector( '.ql-alt' ) ) {
									var altInput = document.createElement( 'input' );
									altInput.className = 'ql-alt';
									altInput.id = 'quill-alt';
									altInput.type = 'text';
									altInput.placeholder = OLRichTextComments.enterAltText;

									var altInputLabel = document.createElement( 'label' );
									altInputLabel.className = 'sr-only';
									altInputLabel.textContent = OLRichTextComments.enterAltText;
									altInputLabel.setAttribute( 'for', 'quill-alt' );

									var altContainerDiv = document.createElement( 'div' );
									altContainerDiv.className = 'ql-image-tooltip-section';
									altContainerDiv.id = 'quill-alt-container';
									altContainerDiv.appendChild( altInput );
									altContainerDiv.appendChild( altInputLabel );

									document.getElementById( 'quill-media' ).insertAdjacentElement( 'afterend', altContainerDiv );
								}

								if ( tooltip ) {
									var altContainerDiv = document.getElementById( 'quill-alt-container' );

									// Put the #quill-media input and its label in a container div.
									var mediaInput = tooltip.querySelector( '#quill-media' );
									if ( mediaInput ) {
										var mediaContainerDiv = document.createElement( 'div' );
										var mediaInputLabel = tooltip.querySelector( 'label[for="quill-media"]' );

										mediaContainerDiv.className = 'ql-image-tooltip-section';
										mediaContainerDiv.appendChild( mediaInput );
										mediaContainerDiv.appendChild( mediaInputLabel );

										// Insert before the .quill-alt-container div.
										if ( altContainerDiv ) {
											altContainerDiv.insertAdjacentElement( 'beforebegin', mediaContainerDiv );
										}
									}

									// Take th .ql-action element and put it into the quill-alt-container div.
									var actionButton = tooltip.querySelector( '.ql-action' );
									if ( actionButton ) {
										if ( altContainerDiv ) {
											altContainerDiv.appendChild( actionButton );
										}
									}
								}
							}, 0);
						});
					}

					var linkButton = toolbar.container.querySelector('button.ql-link');
					if (linkButton) {
						linkButton.addEventListener('click', () => {
							setTimeout(() => {
								var tooltip = document.querySelector( '.ql-editing' );
								var linkInput = tooltip.querySelector( '#quill-media' );
								var inputValue = linkInput.value;

								var inputValueIsUrl = /^(https?:\/\/|www\.)/.test( inputValue );
								if ( ! inputValueIsUrl ) {
									linkInput.value = ''
								}
							}, 0);
						})
					}

				}
			}

			Quill.register({
				'formats/image': CustomImageFormat,
				'themes/snow': CustomSnowTheme
			});

			/**
			 * Initialize Quill Editor
			 */
			var quillEditor = new Quill('#ol-rich-editor', {
					modules: {
						keyboard: {
							bindings: {
								tab: {
									key: 9,
									handler: function(range, context) {
										return true;
									}
								}
							}
						},
						toolbar: {
								container: [ 'bold', 'italic', 'underline', 'link', 'image', { 'list': 'ordered'}, { 'list': 'bullet' } ],
								handlers: {
										image: imageHandler
								}
						}
					},
					theme: 'snow'
			});

			/**
			 * Change link input placeholder
			 */
			var tooltip = quillEditor.theme.tooltip;
			var input = tooltip.root.querySelector('input[data-link]');
			input.dataset.link = 'https://example.com';

			/**
			 * Implement custom handler for the image button.
			 * Show tooltip for entering URL, instead of uploading an image.
			 */
			function imageHandler() {
					const tooltip = quillEditor.theme.tooltip;
					const originalSave = tooltip.save;
					const originalHide = tooltip.hide;

					// Called on save
					tooltip.save = function() {
							// Get the alt text and insert it Quill's generated img tag.
							var altText = tooltip.root.querySelector('.ql-alt');
							if ( 0 === altText.value.length ) {
								return false;
							}

							const range = quillEditor.getSelection(true);
							const value = tooltip.textbox.value;
							const isImageUrl = /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(value);

							// If there is a selected text, remove the selection before inserting the image
							if( range ) {
									if( range.length > 0 ) {
											quillEditor.deleteText(range.index, range.length, 'api' );
									}
							}

							// Insert image
							if (value) {
								if ( isImageUrl ) {
									quillEditor.insertEmbed(range.index, 'image', value, true, 'api' );
								} else {
									quillEditor.insertText( range.index, value );
								}
							}

							var img = quillEditor.root.querySelector('img[src="' + value + '"]');
							if (img) {
								img.setAttribute('alt', altText.value);
							}

							// Remove old value from the tooltip input
							tooltip.textbox.value = '';
					};

					// Called on hide and save.
					tooltip.hide = function () {
						tooltip.save = originalSave;
						tooltip.hide = originalHide;
						tooltip.root.classList.remove( 'ql-image-tooltip' );
						tooltip.root.querySelector( '.ql-alt' ).remove();
						tooltip.hide();
					};

					tooltip.edit('image');
					tooltip.textbox.placeholder = OLRichTextComments.enterMediaUrl;

					tooltip.root.classList.add( 'ql-image-tooltip' );
			}

			/**
			 * Get content of the Quill editor and put it's content
			 * in the comment text field.
			 */
			quillEditor.on( 'text-change', function( delta, oldDelta, source ) {
					if( quillEditor.getText().trim() ) {
							let contentHtml = quillEditor.root.innerHTML;
							$('textarea#comment').val(contentHtml);
							$('#response-notice').remove();
					} else {
							$('textarea#comment').val('');
					}
			});

			document.querySelector( '.ql-image' ).innerHTML = '<svg viewBox="0 0 18 18" aria-hidden="true"> <rect class="ql-stroke" height="10" width="12" x="3" y="4"></rect> <circle class="ql-fill" cx="6" cy="7" r="1"></circle> <polyline class="ql-even ql-fill" points="5 12 5 11 7 9 8 10 11 7 13 9 13 12 5 12"></polyline> </svg>';

			/**
			 * Add aria-label to the buttons in the toolbar;
			 * Add aria-pressed on the buttons in the toolbar;
			 * Add aria-hidden on the SVG icons in the buttons;
			 * Add role and aria-multiline attribute to the editor textarea;
			 */
			$('button.ql-bold').attr( 'aria-label', OLRichTextComments.toggleBoldText );
			$('button.ql-italic').attr( 'aria-label', OLRichTextComments.toggleItalicText );
			$('button.ql-underline').attr( 'aria-label', OLRichTextComments.toggleUnderlineText );
			$('button.ql-link').attr( 'aria-label', OLRichTextComments.toggleLinkModal );
			$('button.ql-list[value="ordered"]').attr('aria-label', OLRichTextComments.toggleOrderedList );
			$('button.ql-list[value="bullet"]').attr('aria-label', OLRichTextComments.toggleBulletedList );
			$('button.ql-image').attr( 'aria-label', OLRichTextComments.toggleMultimediaModal );
			$('.ql-formats button').attr('aria-pressed', false );
			$('.ql-formats button > svg').attr('aria-hidden', true );
			$('#ol-rich-editor .ql-editor').attr( {
					'role': 'textbox',
					'aria-multiline': true
			} );

			/**
			 * Add label on the link and media popups
			 */
			let insertMediaField = $('.ql-tooltip input[data-video="Embed URL"]');
			insertMediaField.attr('id', 'quill-media');
			$('<label for="quill-media" class="sr-only">' + OLRichTextComments.enterMediaUrl + '</label>').insertBefore(insertMediaField);

			/**
			 * Remove ql-preview
			 */
			$('.ql-preview').remove();

			/**
			 * Toggle aria-pressed attribute on clicking the buttons
			 * in the editor's toolbar.
			 */
			$(document).on( 'click', '.ql-formats button', function(e) {
					$(this).attr( 'aria-pressed', $(this).hasClass('ql-active') );
			});

			/**
			 * Validate if the comment textarea is empty and show an error message.
			 */
			$(document).on( 'click', 'form#commentform input#submit', function(e) {
					$('#response-notice').remove();

					let commentElement = $('textarea#comment');
					let isRequired = ( typeof commentElement.attr('required') != 'undefined' && commentElement.attr('required') !== false ) ? true : false;
					let commentText = commentElement.val();

					if( ! commentText && isRequired ) {
							e.preventDefault();
							$('form#commentform').append('<div id="response-notice"><p>' + OLRichTextComments.commentFieldIsRequired + '</p></div>');
							return;
					}
			});
	} );
})(jQuery);
