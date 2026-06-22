document.addEventListener('DOMContentLoaded', () => {
    const orderSelect = document.getElementById('orderBy');
    const blogList = document.querySelector('.blog-list');
    const filterButtons = document.querySelectorAll('.tag-filter');

    if (!blogList) return;

    let activeTag = 'all';

    // Tag filtering
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeTag = btn.dataset.tag;
            applyFilter();
        });
    });

    function applyFilter() {
        const articles = Array.from(blogList.querySelectorAll('.blog-entry'));
        articles.forEach(article => {
            if (activeTag === 'all') {
                article.hidden = false;
            } else {
                const tags = (article.dataset.tags || '').split(',').map(t => t.trim());
                article.hidden = !tags.includes(activeTag);
            }
        });
    }

    // Sorting
    if (orderSelect) {
        orderSelect.addEventListener('change', () => {
            const articles = Array.from(blogList.querySelectorAll('.blog-entry'));

            let sorted;
            switch (orderSelect.value) {
                case 'newest':
                    sorted = articles.sort((a, b) =>
                        new Date(b.querySelector('time').dateTime) -
                        new Date(a.querySelector('time').dateTime)
                    );
                    break;
                case 'oldest':
                    sorted = articles.sort((a, b) =>
                        new Date(a.querySelector('time').dateTime) -
                        new Date(b.querySelector('time').dateTime)
                    );
                    break;
                case 'title-asc':
                    sorted = articles.sort((a, b) =>
                        a.querySelector('h3').innerText.localeCompare(b.querySelector('h3').innerText)
                    );
                    break;
                case 'title-desc':
                    sorted = articles.sort((a, b) =>
                        b.querySelector('h3').innerText.localeCompare(a.querySelector('h3').innerText)
                    );
                    break;
            }

            sorted.forEach(article => blogList.appendChild(article));
        });

        orderSelect.dispatchEvent(new Event('change'));
    }
});
