if (!customElements.get('media-gallery')) {
  customElements.define(
    'media-gallery',
    class MediaGallery extends HTMLElement {
      constructor() {
        super();
        this.elements = {
          liveRegion: this.querySelector('[id^="GalleryStatus"]'),
          viewer: this.querySelector('[id^="GalleryViewer"]'),
          thumbnails: this.querySelector('[id^="GalleryThumbnails"]'),
          dots: this.querySelector('.product-gallery-dots'),
        };
        this.mql = window.matchMedia('(min-width: 750px)');

        // Initialize dot navigation
        if (this.elements.dots) {
          this.initializeDots();
        }

        // Size the mobile slider to the active image (no letterboxing)
        this.initializeMobileHeight();

        // Listen for slide changes to update thumbnails (dots are handled by IntersectionObserver)
        if (this.elements.thumbnails) {
          this.elements.viewer.addEventListener('slideChanged', debounce(this.onSlideChanged.bind(this), 500));
        }

        if (!this.elements.thumbnails) return;

        this.elements.thumbnails.querySelectorAll('[data-target]').forEach((mediaToSwitch) => {
          mediaToSwitch
            .querySelector('button')
            .addEventListener('click', this.setActiveMedia.bind(this, mediaToSwitch.dataset.target, false));
        });
        if (this.dataset.desktopLayout.includes('thumbnail') && this.mql.matches) this.removeListSemantic();
      }

      initializeDots() {
        const dots = this.elements.dots.querySelectorAll('.gallery-dot');
        const slides = this.elements.viewer.querySelectorAll('[data-media-id]');

        // Click handler for dots
        dots.forEach((dot, index) => {
          dot.addEventListener('click', () => {
            if (slides[index]) {
              const mediaId = slides[index].dataset.mediaId;
              this.setActiveMedia(mediaId, false);
              this.updateActiveDot(index);
            }
          });
        });

        // Use scroll listener for reliable slide detection on mobile
        const slider = this.elements.viewer.querySelector('[id^="Slider-"]');
        if (slider && slides.length > 1) {
          let scrollTimeout;
          slider.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
              const slideWidth = slides[0].offsetWidth;
              const currentIndex = Math.round(slider.scrollLeft / slideWidth);
              if (currentIndex >= 0 && currentIndex < slides.length) {
                this.updateActiveDot(currentIndex);
              }
            }, 50);
          });
        }
      }

      initializeMobileHeight() {
        const slider = this.elements.viewer.querySelector('[id^="Slider-Gallery"]');
        if (!slider || !slider.querySelector('.media-fit-contain')) return;
        slider.classList.add('media-fit-contain');

        const mobile = window.matchMedia('(max-width: 749px)');
        const slides = slider.querySelectorAll('.slider__slide');

        const apply = () => {
          if (!mobile.matches) {
            slider.style.height = '';
            return;
          }
          const width = slides[0]?.offsetWidth || 1;
          const index = Math.min(Math.round(slider.scrollLeft / width), slides.length - 1);
          const media = slides[index]?.querySelector('.product-media-container') || slides[index];
          if (media) slider.style.height = `${media.offsetHeight}px`;
        };

        let raf;
        const schedule = () => {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(apply);
        };
        slider.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        slider.querySelectorAll('img').forEach((img) => {
          if (!img.complete) img.addEventListener('load', schedule, { once: true });
        });
        apply();
      }

      updateActiveDot(activeIndex) {
        if (!this.elements.dots) return;

        const dots = this.elements.dots.querySelectorAll('.gallery-dot');
        dots.forEach((dot, index) => {
          if (index === activeIndex) {
            dot.classList.add('active');
          } else {
            dot.classList.remove('active');
          }
        });
      }

      onSlideChanged(event) {
        // Update thumbnails on slide change (dots are handled by IntersectionObserver)
        if (!this.elements.thumbnails) return;

        const thumbnail = this.elements.thumbnails.querySelector(
          `[data-target="${event.detail.currentElement.dataset.mediaId}"]`
        );
        this.setActiveThumbnail(thumbnail);
      }

      setActiveMedia(mediaId, prepend) {
        const activeMedia =
          this.elements.viewer.querySelector(`[data-media-id="${mediaId}"]`) ||
          this.elements.viewer.querySelector('[data-media-id]');
        if (!activeMedia) {
          return;
        }
        this.elements.viewer.querySelectorAll('[data-media-id]').forEach((element) => {
          element.classList.remove('is-active');
        });
        activeMedia?.classList?.add('is-active');

        if (prepend) {
          activeMedia.parentElement.firstChild !== activeMedia && activeMedia.parentElement.prepend(activeMedia);

          if (this.elements.thumbnails) {
            const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
            activeThumbnail.parentElement.firstChild !== activeThumbnail && activeThumbnail.parentElement.prepend(activeThumbnail);
          }

          if (this.elements.viewer.slider) this.elements.viewer.resetPages();
        }

        this.preventStickyHeader();
        window.setTimeout(() => {
          if (!this.mql.matches || this.elements.thumbnails) {
            activeMedia.parentElement.scrollTo({ left: activeMedia.offsetLeft });
          }
          const activeMediaRect = activeMedia.getBoundingClientRect();
          // Don't scroll if the image is already in view
          if (activeMediaRect.top > -0.5) return;
          const top = activeMediaRect.top + window.scrollY;
          window.scrollTo({ top: top, behavior: 'smooth' });
        });
        this.playActiveMedia(activeMedia);

        if (!this.elements.thumbnails) return;
        const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
        this.setActiveThumbnail(activeThumbnail);
        this.announceLiveRegion(activeMedia, activeThumbnail.dataset.mediaPosition);
      }

      setActiveThumbnail(thumbnail) {
        if (!this.elements.thumbnails || !thumbnail) return;

        this.elements.thumbnails
          .querySelectorAll('button')
          .forEach((element) => element.removeAttribute('aria-current'));
        thumbnail.querySelector('button').setAttribute('aria-current', true);
        if (this.elements.thumbnails.isSlideVisible(thumbnail, 10)) return;

        this.elements.thumbnails.slider.scrollTo({ left: thumbnail.offsetLeft });
      }

      announceLiveRegion(activeItem, position) {
        const image = activeItem.querySelector('.product__modal-opener--image img');
        if (!image) return;
        image.onload = () => {
          this.elements.liveRegion.setAttribute('aria-hidden', false);
          this.elements.liveRegion.innerHTML = window.accessibilityStrings.imageAvailable.replace('[index]', position);
          setTimeout(() => {
            this.elements.liveRegion.setAttribute('aria-hidden', true);
          }, 2000);
        };
        image.src = image.src;
      }

      playActiveMedia(activeItem) {
        window.pauseAllMedia();
        const deferredMedia = activeItem.querySelector('.deferred-media');
        if (deferredMedia) deferredMedia.loadContent(false);
      }

      preventStickyHeader() {
        this.stickyHeader = this.stickyHeader || document.querySelector('sticky-header');
        if (!this.stickyHeader) return;
        this.stickyHeader.dispatchEvent(new Event('preventHeaderReveal'));
      }

      removeListSemantic() {
        if (!this.elements.viewer.slider) return;
        this.elements.viewer.slider.setAttribute('role', 'presentation');
        this.elements.viewer.sliderItems.forEach((slide) => slide.setAttribute('role', 'presentation'));
      }
    }
  );
}
