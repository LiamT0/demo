// Page Navigation
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    document.getElementById(pageName).classList.add('active');

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');

    // Scroll to top
    window.scrollTo(0, 0);
}

// Settings Tabs
function showSettingsTab(tabName) {
    document.querySelectorAll('.settings-content').forEach(content => {
        content.style.display = 'none';
    });
    document.getElementById(tabName + '-tab').style.display = 'block';

    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Revenue Chart
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(62, 77, 67, 0.16)');
    gradient.addColorStop(1, 'rgba(62, 77, 67, 0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
            datasets: [{
                label: 'Revenue',
                data: [15200, 18400, 19800, 17600, 22100, 24800],
                borderColor: '#3e4d43',
                backgroundColor: gradient,
                borderWidth: 1.5,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#3e4d43',
                pointBorderColor: '#fdfcf9',
                pointBorderWidth: 1,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#3e4d43',
                    borderColor: '#d9d6cd',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return '$' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: '#d9d6cd',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64675d',
                        font: {
                            family: 'DM Sans'
                        }
                    }
                },
                y: {
                    grid: {
                        color: '#d9d6cd',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64675d',
                        font: {
                            family: 'DM Sans'
                        },
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        }
                    }
                }
            }
        }
    });

    // Add interactivity to action cards
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('.action-title').textContent;
            alert('This would open the ' + title + ' interface');
        });
    });
});
