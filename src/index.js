import axios from "axios";
import Notiflix from 'notiflix';
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";

const API_KEY = '37052172-7d8e3fe994748e608cfbdb6c0';
const BASE_URL = 'https://pixabay.com/api/';

const refs = {
    form: document.querySelector('.form'),
    inputSearch: document.querySelector('[name="searchQuery"]'),
    listCard: document.querySelector('.js-list-cards')
}

const guard = document.querySelector('.js-guard');

let options = {
    root: null,
    rootMargin: "330px",
    threshold: 0,
}
let observer = new IntersectionObserver(handlerPagination, options);

let page = 1;
let totalHits = 0;
const perPage = 40;

const lightbox = new SimpleLightbox('.gallery a');

refs.form.addEventListener('submit', hendlerSearchForm);

async function hendlerSearchForm(event) {
    event.preventDefault();

    //cleaning cards before new search:
    clearListCards();

    page = 1; //+

    await serviceSearchImages();
}

async function serviceSearchImages() {
    const inputValue = refs.inputSearch.value.trim();
    const url = `${BASE_URL}?key=${API_KEY}&q=${encodeURIComponent(inputValue)}&image_type=photo&orientation=horizontal&safesearch=true&page=${page}&per_page=40`
    try {
        const response = await axios.get(url);

        const { data } = response;
        const imagesAll = data.hits;
        totalHits = data.totalHits;

        if (imagesAll.length === 0) {
            if (page === 1) {
                Notiflix.Notify.failure('Sorry, there are no images matching your search query. Please try again!')
            }
        } else {
            Notiflix.Notify.info(`Hooray! We found ${totalHits} images.`)
            renderDataImage(imagesAll);
        }
        if (imagesAll.length < totalHits) {
            observer.observe(guard);
        } else if (imagesAll.length === totalHits) {
            // Notiflix.Notify.info("We're sorry, but you've reached the end of search results.")
            observer.unobserve(guard);
        }
    } catch (error) {
        console.log(error)
    }
}

function createMarkup(image) {
    return `
    <div class="photo-card">
        <div class="gallery">
            <a class="gallery__link" href="${image.largeImageURL}">
                <img src="${image.webformatURL}" alt="${image.tags}" loading="lazy" width="335"/>
            </a>
        </div>
        <div class="info">
            <p class="info-item"><b>Likes: </b>${image.likes}</p>
            <p class="info-item"><b>Views: </b> ${image.views}</p>
            <p class="info-item"><b>Comments: </b>${image.comments}</p>
            <p class="info-item"><b>Downloads: </b>${image.downloads}</p>
        </div>
    </div>`;
}

function renderDataImage(array) {
    const cardsImage = array.map(image => createMarkup(image)).join('');
    // refs.listCard.innerHTML = cardsImage;
    refs.listCard.insertAdjacentHTML('beforeend', cardsImage);

    const { height: cardHeight } = refs.listCard.firstElementChild.getBoundingClientRect();
    window.scrollBy({
        top: cardHeight * 0.4,
        behavior: "smooth",
    });

    lightbox.refresh();
}

function clearListCards() {
    refs.listCard.innerHTML = '';
}

async function handlerPagination(entries) {
    entries.forEach(async entry => {
        if (entry.isIntersecting && page * perPage < totalHits) {
            page += 1;
            await serviceSearchImages(page);
        }
    })
}