document.addEventListener('DOMContentLoaded', () => {
    // 1. Hero Welcome Section Control
    const heroSection = document.getElementById('heroSection');
    const heroReadBtn = document.getElementById('heroReadBtn');

    if (localStorage.getItem('manganexa_welcome_hidden') === 'true') {
        if (heroSection) heroSection.classList.add('hidden');
    }

    if (heroReadBtn) {
        heroReadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (heroSection) heroSection.classList.add('hidden');
            localStorage.setItem('manganexa_welcome_hidden', 'true');
            
            const catalog = document.getElementById('catalog');
            if (catalog) catalog.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // 2. Auth System (User Login / Registration)
    let currentUser = localStorage.getItem('manganexa_current_user') || null;

    function updateAuthUI() {
        const userProfileArea = document.getElementById('userProfileArea');
        if (!userProfileArea) return;

        if (currentUser) {
            userProfileArea.innerHTML = `
                <div class="user-badge">
                    <i class="fa-solid fa-user"></i> ${currentUser}
                    <button class="btn-logout" id="logoutBtn">Logout</button>
                </div>
            `;
            document.getElementById('logoutBtn').addEventListener('click', () => {
                currentUser = null;
                localStorage.removeItem('manganexa_current_user');
                updateAuthUI();
                renderCatalog();
            });
        } else {
            userProfileArea.innerHTML = `<button class="btn-login" id="loginBtn">Log In</button>`;
            document.getElementById('loginBtn').addEventListener('click', () => {
                document.getElementById('authModal').classList.remove('hidden');
            });
        }
    }

    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('authUsername').value.trim();
            if (username) {
                currentUser = username;
                localStorage.setItem('manganexa_current_user', username);
                document.getElementById('authModal').classList.add('hidden');
                authForm.reset();
                updateAuthUI();
                renderCatalog();
            }
        });
    }

    const closeAuthBtn = document.getElementById('closeAuth');
    if (closeAuthBtn) {
        closeAuthBtn.addEventListener('click', () => {
            document.getElementById('authModal').classList.add('hidden');
        });
    }

    // 3. Data Initialization
    let myMangaList = [];
    try {
        myMangaList = JSON.parse(localStorage.getItem('manganexa_my_titles')) || [];
    } catch (error) {
        myMangaList = [];
    }

    let favoritesList = [];
    try {
        favoritesList = JSON.parse(localStorage.getItem('manganexa_favorites')) || [];
    } catch (error) {
        favoritesList = [];
    }

    const myTitlesGrid = document.getElementById('myTitlesGrid');
    const favoritesGrid = document.getElementById('favoritesGrid');

    function fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    }

    // 4. Generate Card HTML
    function createCardHTML(manga, index) {
        const isFav = favoritesList.includes(index);
        return `
            <div class="manga-card">
                <div class="manga-cover">
                    <img src="${manga.cover}" alt="${manga.title}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://picsum.photos/300/420';">
                    <span class="tag-type">${manga.type}</span>
                    
                    <button class="fav-btn ${isFav ? 'active' : ''}" data-index="${index}" title="Favorite">
                        <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
                    </button>

                    <div class="card-menu-container">
                        <button class="menu-btn" data-index="${index}" title="Options">
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                        <div class="dropdown-menu hidden" id="menu-${index}">
                            <button class="dropdown-item add-pages-btn" data-index="${index}">
                                <i class="fa-solid fa-plus"></i> Add Pages
                            </button>
                            <button class="dropdown-item rename-btn" data-index="${index}">
                                <i class="fa-solid fa-pen"></i> Rename
                            </button>
                            <button class="dropdown-item status-btn" data-index="${index}">
                                <i class="fa-solid fa-bookmark"></i> Status
                            </button>
                            <button class="dropdown-item details-btn" data-index="${index}">
                                <i class="fa-solid fa-circle-info"></i> Details
                            </button>
                            <button class="dropdown-item delete-item delete-btn" data-index="${index}">
                                <i class="fa-solid fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>

                <div class="manga-info">
                    <h3 class="manga-title">${manga.title}</h3>
                    <p class="manga-chapter">${manga.status || 'Reading'}</p>
                    <a href="#" class="btn-read" data-index="${index}">Read</a>
                </div>
            </div>
        `;
    }

    // Render Catalog & Favorites
    function renderCatalog() {
        if (myTitlesGrid) {
            myTitlesGrid.innerHTML = '';
            if (myMangaList.length === 0) {
                myTitlesGrid.innerHTML = '<p style="color: var(--text-gray); grid-column: 1/-1; text-align: center;">The catalog is empty. Add your first title using the form below!</p>';
            } else {
                myMangaList.forEach((manga, index) => {
                    myTitlesGrid.innerHTML += createCardHTML(manga, index);
                });
            }
        }

        if (favoritesGrid) {
            favoritesGrid.innerHTML = '';
            const favManga = myMangaList.filter((_, idx) => favoritesList.includes(idx));
            if (favManga.length === 0) {
                favoritesGrid.innerHTML = '<p style="color: var(--text-gray); grid-column: 1/-1; text-align: center;">No favorite titles added yet.</p>';
            } else {
                myMangaList.forEach((manga, index) => {
                    if (favoritesList.includes(index)) {
                        favoritesGrid.innerHTML += createCardHTML(manga, index);
                    }
                });
            }
        }

        const favCount = document.getElementById('favCount');
        if (favCount) favCount.textContent = favoritesList.length;

        attachCardEvents();
    }

    // Attach Card Actions
    function attachCardEvents() {
        document.querySelectorAll('.btn-read').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const index = btn.getAttribute('data-index');
                openReader(myMangaList[index]);
            });
        });

        document.querySelectorAll('.fav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!currentUser) {
                    alert('Please Log In to save titles to your Favorites!');
                    document.getElementById('authModal').classList.remove('hidden');
                    return;
                }
                const index = parseInt(btn.getAttribute('data-index'));
                const favIndex = favoritesList.indexOf(index);
                if (favIndex === -1) {
                    favoritesList.push(index);
                } else {
                    favoritesList.splice(favIndex, 1);
                }
                localStorage.setItem('manganexa_favorites', JSON.stringify(favoritesList));
                renderCatalog();
            });
        });

        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = btn.getAttribute('data-index');
                const targetMenu = document.getElementById(`menu-${index}`);
                
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    if (menu !== targetMenu) menu.classList.add('hidden');
                });

                if (targetMenu) targetMenu.classList.toggle('hidden');
            });
        });

        document.querySelectorAll('.add-pages-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = btn.getAttribute('data-index');
                document.getElementById('addPagesMangaIndex').value = index;
                document.getElementById('addPagesTitle').textContent = `Add Pages to "${myMangaList[index].title}"`;
                document.getElementById('addPagesModal').classList.remove('hidden');
            });
        });

        document.querySelectorAll('.rename-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = btn.getAttribute('data-index');
                const newTitle = prompt('Enter new title name:', myMangaList[index].title);
                if (newTitle && newTitle.trim() !== '') {
                    myMangaList[index].title = newTitle.trim();
                    saveAndRender();
                }
            });
        });

        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = btn.getAttribute('data-index');
                const statusList = ['Plan to read', 'Reading', 'Completed'];
                const currentStatus = myMangaList[index].status || 'Reading';
                const nextIndex = (statusList.indexOf(currentStatus) + 1) % statusList.length;
                myMangaList[index].status = statusList[nextIndex];
                saveAndRender();
            });
        });

        document.querySelectorAll('.details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = btn.getAttribute('data-index');
                const manga = myMangaList[index];
                
                document.getElementById('detailsTitle').textContent = manga.title;
                document.getElementById('detailsBody').innerHTML = `
                    <p><strong>Type:</strong> ${manga.type}</p>
                    <p><strong>Status:</strong> ${manga.status || 'Reading'}</p>
                    <p><strong>Total Pages:</strong> ${manga.pages ? manga.pages.length : 0}</p>
                `;
                document.getElementById('detailsModal').classList.remove('hidden');
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.getAttribute('data-index'));
                if (confirm(`Are you sure you want to delete "${myMangaList[index].title}"?`)) {
                    myMangaList.splice(index, 1);
                    favoritesList = favoritesList.filter(i => i !== index).map(i => i > index ? i - 1 : i);
                    localStorage.setItem('manganexa_favorites', JSON.stringify(favoritesList));
                    saveAndRender();
                }
            });
        });
    }

    // 5. Submit Add Extra Pages Form
    const addPagesForm = document.getElementById('addPagesForm');
    if (addPagesForm) {
        addPagesForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const index = document.getElementById('addPagesMangaIndex').value;
            const extraFiles = Array.from(document.getElementById('extraPagesFiles').files);
            const extraUrls = document.getElementById('extraPagesUrls').value;

            let newPages = [];
            if (extraFiles.length > 0) {
                newPages = await Promise.all(extraFiles.map(file => fileToDataURL(file)));
            } else if (extraUrls.trim() !== '') {
                newPages = extraUrls.split(',').map(u => u.trim()).filter(u => u !== '');
            }

            if (!myMangaList[index].pages) myMangaList[index].pages = [];
            myMangaList[index].pages.push(...newPages);

            saveAndRender();
            addPagesForm.reset();
            document.getElementById('addPagesModal').classList.add('hidden');
            alert('Pages successfully added!');
        });
    }

    const closeAddPagesBtn = document.getElementById('closeAddPages');
    if (closeAddPagesBtn) {
        closeAddPagesBtn.addEventListener('click', () => {
            document.getElementById('addPagesModal').classList.add('hidden');
        });
    }

    // 6. Form Handling (Add New Title)
    const addMangaForm = document.getElementById('addMangaForm');
    if (addMangaForm) {
        addMangaForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('mangaTitle').value;
            const type = document.getElementById('mangaType').value;
            
            const coverFile = document.getElementById('mangaCoverFile').files[0];
            const coverUrl = document.getElementById('mangaCoverUrl').value;
            let cover = 'https://picsum.photos/300/420';

            if (coverFile) {
                cover = await fileToDataURL(coverFile);
            } else if (coverUrl.trim() !== '') {
                cover = coverUrl.trim();
            }

            const pageFiles = Array.from(document.getElementById('mangaPagesFiles').files);
            const rawPagesUrls = document.getElementById('mangaPagesUrls').value;
            let pages = [];

            if (pageFiles.length > 0) {
                pages = await Promise.all(pageFiles.map(file => fileToDataURL(file)));
            } else if (rawPagesUrls.trim() !== '') {
                pages = rawPagesUrls.split(',').map(url => url.trim()).filter(url => url !== '');
            }

            const newManga = { title, type, cover, pages, status: 'Reading' };

            try {
                myMangaList.push(newManga);
                saveAndRender();
                addMangaForm.reset();
                alert('Title successfully added!');
            } catch (err) {
                alert('Browser storage is full! Try uploading smaller files or using image URLs instead.');
            }
        });
    }

    function saveAndRender() {
        localStorage.setItem('manganexa_my_titles', JSON.stringify(myMangaList));
        renderCatalog();
    }

    // Modal Reader Functionality
    function openReader(manga) {
        document.getElementById('readerTitle').textContent = manga.title;
        const container = document.getElementById('pagesContainer');
        container.innerHTML = '';

        if (manga.pages && manga.pages.length > 0) {
            manga.pages.forEach(url => {
                const img = document.createElement('img');
                img.src = url;
                img.referrerPolicy = 'no-referrer';
                container.appendChild(img);
            });
        } else {
            container.innerHTML = '<p style="text-align:center;">No pages found.</p>';
        }

        document.getElementById('readerModal').classList.remove('hidden');
    }

    // Close Modals Handling
    const closeReaderBtn = document.getElementById('closeReader');
    if (closeReaderBtn) {
        closeReaderBtn.addEventListener('click', () => {
            document.getElementById('readerModal').classList.add('hidden');
        });
    }

    const closeDetailsBtn = document.getElementById('closeDetails');
    if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener('click', () => {
            document.getElementById('detailsModal').classList.add('hidden');
        });
    }

    // 7. Live Search Logic with Auto-suggestions
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');

    if (searchInput && searchDropdown) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();

            if (query === '') {
                searchDropdown.classList.add('hidden');
                searchDropdown.innerHTML = '';
                return;
            }

            const matches = myMangaList.filter(manga => 
                manga.title.toLowerCase().includes(query)
            );

            searchDropdown.innerHTML = '';

            if (matches.length > 0) {
                matches.forEach(manga => {
                    const item = document.createElement('div');
                    item.className = 'search-item';
                    item.innerHTML = `
                        <img src="${manga.cover}" class="search-item-img" referrerpolicy="no-referrer" onerror="this.src='https://picsum.photos/300/420'">
                        <div class="search-item-info">
                            <span class="search-item-title">${manga.title}</span>
                            <span class="search-item-type">${manga.type}</span>
                        </div>
                    `;
                    item.addEventListener('click', () => {
                        openReader(manga);
                        searchDropdown.classList.add('hidden');
                        searchInput.value = '';
                    });
                    searchDropdown.appendChild(item);
                });
            } else {
                searchDropdown.innerHTML = `
                    <div class="search-no-results">
                        <i class="fa-solid fa-ghost"></i> Nothing found for "${searchInput.value}"
                    </div>
                `;
            }

            searchDropdown.classList.remove('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                searchDropdown.classList.add('hidden');
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.card-menu-container')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
        }
    });

    // Initial Setup
    updateAuthUI();
    renderCatalog();
});