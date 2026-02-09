# Pages module
from src.pages.home import render_home_page
from src.pages.methodology import render_methodology_page
from src.pages.authors import render_authors_page
from src.pages.download import render_download_page
from src.pages.contact import render_contact_page

__all__ = [
    "render_home_page",
    "render_methodology_page",
    "render_authors_page",
    "render_download_page",
    "render_contact_page",
]
