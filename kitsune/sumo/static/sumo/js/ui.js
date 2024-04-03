import _throttle from "underscore/modules/throttle";
import UITour from "./libs/uitour";
import trackEvent from "sumo/js/analytics";

(function($) {
  'use strict';

  jQuery(function() {
    initFolding();
    initAnnouncements();

    $('#delete-profile-username-input').on('keyup', function(ev) {
      var username = $('#delete-profile-username').val();
      var inputUsername = $('#delete-profile-username-input').val();
      if (inputUsername === username) {
        $('#delete-profile-button').prop('disabled', false);
      } else {
        $('#delete-profile-button').prop('disabled', true);
      }
    });

    $(window).on('scroll', _throttle(function() {
      if ($(window).scrollTop() > $('body > header').outerHeight()) {
        $('body').addClass('scroll-header');
      } else {
        $('body').removeClass('scroll-header');
      }
    }, 100));

    $('.ui-truncatable .show-more-link').on('click', function(ev) {
      ev.preventDefault();
      $(this).closest('.ui-truncatable').removeClass('truncated');
    });

    $(document).on('click', '.close-button', function() {
      var $this = $(this);
      var $target;
      if ($this.data('close-id')) {
        $target = $('#' + $this.data('close-id'));
        if ($this.data("close-memory") === "remember") {
          localStorage.setItem($this.data("close-id") + ".closed", true);
        } else if ($this.data("close-memory") === "session") {
          sessionStorage.setItem($this.data("close-id") + ".closed", true);
        }
      } else {
        $target = $this.parent();
      }
      if ($this.data('close-type') === 'remove') {
        $target.remove();
      } else {
        $target.hide();
      }
    });

    $(document).on('change', 'select[data-submit]', function() {
      var $this = $(this);
      var $form = ($this.data('submit')) ? $('#' + $this.data('submit')) : $this.closest('form');
      $form.trigger('submit');
    });

    $('[data-close-memory="remember"]').each(function() {
      var $this = $(this);
      var id = $this.data('close-id');
      if (id) {
        var $target = $('#' + id);
        if (localStorage.getItem(id + '.closed') === 'true') {
          if ($this.data('close-type') === 'remove') {
            $target.remove();
          }
          else {
            $('#' + id).hide();
          }
        } else {
            if ($target.data("close-initial") === "hidden") {
              $target.show();
          }
        }
      }
    });

    $('[data-close-memory="session"]').each(function() {
      var $this = $(this);
      var id = $this.data("close-id");
      if (id) {
        var $target = $("#" + id);
        if ($target.data("close-initial") === "hidden") {
          if (sessionStorage.getItem(id + ".closed") != "true") {
            $target.show();
          }
        }
      }
    });

    $('[data-toggle]').each(function() {
      var $this = $(this);
      var $target = ($this.data('toggle-target')) ? $($this.data('toggle-target')) : $this;
      var trigger = ($this.data('toggle-trigger')) ? $this.data('toggle-trigger') : 'click';
      var targetId = $target.attr('id');

      if ($this.data('toggle-sticky') && targetId) {
        var targetClasses = localStorage.getItem(targetId + '.classes') || '[]';
        targetClasses = JSON.parse(targetClasses);
        $target.addClass(targetClasses.join(' '));
      }

      $this.on(trigger, function(ev) {
        ev.preventDefault();
        var classname = $this.data('toggle');
        $target.toggleClass(classname);

        if ($this.data('toggle-sticky') && targetId) {
          var classes = localStorage.getItem(targetId + '.classes') || '[]';
          classes = JSON.parse(classes);
          var i = classes.indexOf(classname);

          if ($target.hasClass(classname) && i === -1) {
            classes.push(classname);
          } else if (!$target.hasClass(classname) && i > -1) {
            classes.splice(i, 1);
          }

          localStorage.setItem(targetId + '.classes', JSON.stringify(classes));
        }
        return false;
      });
    });

    $('[data-ui-type="tabbed-view"]').each(function() {
      var $tv = $(this);
      var $tabs = $tv.children('[data-tab-role="tabs"]').children().children();
      var $panels = $tv.children('[data-tab-role="panels"]').children();

      $tabs.each(function(i) {
        $(this).on('click', function(e) {
          e.preventDefault();
          $panels.hide();
          $panels.eq(i).show();
          $tabs.removeClass('selected');
          $tabs.eq(i).addClass('selected');
        });
      });

      $tabs.first().trigger('click');
    });

    $('.btn, .button, a').each(function() {
      var $this = $(this);
      var $form = $this.closest('form');
      var type = $this.attr('data-type');
      var trigger = $this.attr('data-trigger');

      if (type === 'submit') {
        // Clicking the element will submit a form.

        if ($this.attr('data-form')) {
          $form = $('#' + $this.attr('data-form'));
        }

        $this.on('click', function(ev) {
          var name = $this.attr('data-name');
          var value = $this.attr('data-value');

          ev.preventDefault();

          if (name) {
            var $input = $('<input type="hidden">');

            $input.attr('name', name);

            if (value) {
              $input.val(value);
            } else {
              $input.val('1');
            }

            $form.append($input);
          }

          if ($this.attr('data-nosubmit') !== '1') {
            $form.trigger('submit');
          }
        });
      } else if (trigger === 'click') {
        // Trigger a click on another element.

        $this.on('click', function(ev) {
          ev.preventDefault();
          $($this.attr('data-trigger-target'))[0].trigger('click');
          return false;
        });
      }
    });

    var foldingSelectors = '.folding-section, [data-ui-type="folding-section"]';

    $('body').on('click', foldingSelectors + ' header', function() {
      $(this).closest(foldingSelectors).toggleClass('collapsed');
    });

    $('form[data-confirm]').on('submit', function() {
      return confirm($(this).data('confirm-text'));
    });
  });

  $(window).on('load', function() {
    $('[data-ui-type="carousel"]').each(function() {
      var $this = $(this);
      var $container = $(this).children().first();

      var width = 0;
      var height = 0;

      $container.children().each(function() {
        if (height < $(this).outerHeight()) {
          height = $(this).outerHeight();
        }
        width += $(this).outerWidth() + parseInt($(this).css('marginRight')) + parseInt($(this).css('marginLeft'));
      });

      $this.css('height', height + 'px');
      $container.css({ 'width': width + 'px', 'height': height + 'px' });
      $container.children().css('height', height + 'px');

      var $left = $('#' + $this.data('left'));
      var $right = $('#' + $this.data('right'));

      var scrollInterval;

      $left.on('mouseover', function() {
        scrollInterval = setInterval(function() {
          $this.scrollLeft($this.scrollLeft() - 1);
        }, 1);
      });

      $left.on('mouseout', function() {
        clearInterval(scrollInterval);
      });

      $right.on('mouseover', function() {
        scrollInterval = setInterval(function() {
          $this.scrollLeft($this.scrollLeft() + 1);
        }, 1);
      });

      $right.on('mouseout', function() {
        clearInterval(scrollInterval);
      });
    });
  });

  function initFolding() {
    var $folders = $('.sidebar-folding > li');
    // When a header is clicked, expand/contract the menu items.
    $folders.children('a, span').on("click", function() {
      var $parent = $(this).parent();
      $parent.toggleClass('selected');
      // Store this for future page loads.
      var id = $parent.attr('id');
      var folded = $parent.hasClass('selected');
      if (id) {
        localStorage.setItem(id + '.folded', folded);
      }
      // prevent default
      return false;
    });

    // Load the folded/unfolded state of the
    // menus from local storage and apply it.
    $folders.each(function() {
      var $this = $(this);
      var id = $this.attr('id');

      if (id) {
        var folded = localStorage.getItem(id + '.folded');

        if (folded === 'true') {
          $this.addClass('selected');
        } else if (folded === 'false') {
          $this.removeClass('selected');
        }
      }
    });
  }

  function initAnnouncements() {
    var $announcements = $('#announcements');

    // When an announcement is closed, remember it.
    $announcements.on('click', '.close-button', function() {
      var id = $(this).closest('.announce-bar').attr('id');
      localStorage.setItem(id + '.closed', true);
    });

    // If an announcement has not been hidden before, show it.
    $announcements.find('.announce-bar').each(function() {
      var $this = $(this);
      var id = $this.attr('id');
      if (localStorage.getItem(id + '.closed') !== 'true') {
        $this.show();
      }
    });
  }

  $(document).on('click', '#show-password', function() {
    var $form = $(this).closest('form');
    var $pw = $form.find('input[name="password"]');
    $pw.attr('type', (this.checked) ? 'text' : 'password');
  });

  $(document).on('click', '[data-mozilla-ui-reset]', function(ev) {
    ev.preventDefault();
    // Send event to GA for metrics/reporting purposes.
    trackEvent('refresh_firefox_click');

    UITour.resetFirefox();
    return false;
  });

  $(document).on("click", "[data-mozilla-ui-preferences]", function (ev) {
    ev.preventDefault();
    var pane = ev.target.dataset.mozillaUiPreferences;
    UITour.openPreferences(pane);
    return false;
  });

})(jQuery);
