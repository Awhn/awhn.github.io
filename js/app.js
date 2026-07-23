(function () {
  'use strict';

  var root = document.documentElement;
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-tab]'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.tab-panel'));
  var themeSwitch = document.querySelector('.theme-switch');
  var projects = [];
  var activeFilter = 'all';
  var categoryLabels = { hw: 'HARDWARE', be: 'BACKEND', ai: 'AI' };

  function activateTab(name, updateHash) {
    document.getElementById('workspace').dataset.active = name;
    tabs.forEach(function (tab) {
      var selected = tab.dataset.tab === name;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(function (panel) {
      var selected = panel.id === 'panel-' + name;
      panel.hidden = !selected;
      panel.classList.toggle('is-active', selected);
    });
    if (updateHash) history.replaceState(null, '', '#' + name);
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { activateTab(tab.dataset.tab, true); });
    tab.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      var offset = event.key === 'ArrowRight' ? 1 : -1;
      var next = tabs[(index + offset + tabs.length) % tabs.length];
      next.focus();
      activateTab(next.dataset.tab, true);
    });
  });

  document.querySelectorAll('[data-tab-link]').forEach(function (control) {
    control.addEventListener('click', function (event) {
      event.preventDefault();
      activateTab(control.dataset.tabLink, true);
    });
  });

  function setTheme(theme) {
    var isLight = theme === 'light';
    root.dataset.theme = theme;
    themeSwitch.setAttribute('aria-pressed', String(isLight));
    themeSwitch.setAttribute('aria-label', isLight ? '다크 테마로 전환' : '화이트 테마로 전환');
    document.querySelector('meta[name="theme-color"]').content = isLight ? '#edf6fa' : '#071522';
    localStorage.setItem('awhn-theme', theme);
  }

  themeSwitch.addEventListener('click', function () {
    setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  });
  setTheme(localStorage.getItem('awhn-theme') || 'dark');

  function renderProjects() {
    var grid = document.getElementById('project-grid');
    var visible = projects.filter(function (project) { return activeFilter === 'all' || project.category === activeFilter; });
    if (!visible.length) {
      grid.innerHTML = '<p class="empty-state">이 카테고리의 프로젝트가 아직 없습니다.</p>';
      return;
    }
    grid.innerHTML = visible.map(function (project) {
      return '<button class="project-card jelly-card" type="button" data-project="' + project.id + '">' +
        '<span class="project-info"><span class="project-category">' + categoryLabels[project.category] + '</span><small>' + project.date + '</small><h3>' + project.title + '</h3><p>' + project.subtitle + '</p><span class="project-open">파일 열기 <i class="fa fa-arrow-right" aria-hidden="true"></i></span></span>' +
        '<span class="project-thumb"><img src="' + project.thumbnail + '" alt=""><span class="project-file-icon"><i class="fa fa-file-image-o" aria-hidden="true"></i></span></span></button>';
    }).join('');
    grid.querySelectorAll('[data-project]').forEach(function (card) {
      card.addEventListener('click', function () { openProject(card.dataset.project); });
    });
  }

  function updateCounts() {
    document.getElementById('count-all').textContent = projects.length;
    ['hw', 'be', 'ai'].forEach(function (category) {
      document.getElementById('count-' + category).textContent = projects.filter(function (project) { return project.category === category; }).length;
    });
  }

  document.querySelectorAll('[data-filter]').forEach(function (filter) {
    filter.addEventListener('click', function () {
      activeFilter = filter.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(function (item) {
        var selected = item === filter;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-selected', String(selected));
      });
      renderProjects();
    });
  });

  function openProject(id) {
    var project = projects.find(function (item) { return item.id === id; });
    if (!project) return;
    document.getElementById('dialog-content').innerHTML = '<div class="dialog-project-card"><img class="dialog-thumb" src="' + project.image + '" alt="' + project.title + '">' +
      '<div class="dialog-body"><p class="eyebrow"><span></span>' + categoryLabels[project.category] + ' · ' + project.date + '</p><h2>' + project.title + '</h2><p>' + project.description + '</p><div class="tag-list">' + project.tags.map(function (tag) { return '<span>' + tag + '</span>'; }).join('') + '</div></div></div>';
    document.getElementById('project-dialog').showModal();
  }

  var dialog = document.getElementById('project-dialog');
  document.querySelector('.dialog-close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });

  fetch('data/projects/index.json').then(function (response) {
    if (!response.ok) throw new Error('Project index request failed');
    return response.json();
  }).then(function (files) {
    return Promise.all(files.map(function (file) {
      return fetch('data/projects/' + file).then(function (response) {
        if (!response.ok) throw new Error('Project file request failed: ' + file);
        return response.json();
      });
    }));
  }).then(function (data) {
    projects = data;
    updateCounts();
    renderProjects();
  }).catch(function () {
    document.getElementById('project-grid').innerHTML = '<p class="empty-state">프로젝트 파일을 불러오지 못했습니다.</p>';
  });

  var initial = location.hash.slice(1);
  activateTab(['home', 'skills', 'projects', 'contact'].indexOf(initial) > -1 ? initial : 'home', false);
}());
