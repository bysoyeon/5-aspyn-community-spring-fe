document.addEventListener("DOMContentLoaded", async function () {
  async function getConfig() {
    const response = await fetch("/config");
    const config = await response.json();
    return config.API_URL;
  }

  const API_URL = await getConfig();

  // 로그인 유저 정보 가져오기
  const user = await fetchUserInfo();
  if (!user) return;

  const loginUser = user.user_id;
  const profileImage = document.querySelector(".header-box img");

  // 상단 로그인 유저의 프로필 이미지
  if (user.profile_url) {
    profileImage.src = user.profile_url;
  }

  const profileBox = document.querySelector(".header-box");
  const options = document.querySelector(".opt-pos");

  // 옵션 박스 보이기
  function showOptions() {
    options.classList.remove("hide"); // 옵션 박스 보이기
  }

  // 옵션 박스 숨기기
  function hideOptions() {
    options.classList.add("hide"); // 옵션 박스 숨기기
  }

  // 프로필 이미지에 마우스를 올리면 옵션 박스 보이기
  profileBox.addEventListener("mouseover", showOptions);

  // 옵션 박스에 마우스를 올리면 계속 보이기
  options.addEventListener("mouseover", showOptions);

  // 프로필 이미지와 옵션 박스에서 마우스를 벗어나면 옵션 박스 숨기기
  profileBox.addEventListener("mouseleave", () => {
    setTimeout(() => {
      if (!options.matches(":hover")) {
        hideOptions();
      }
    }, 100); // 짧은 지연 시간 추가
  });

  options.addEventListener("mouseleave", hideOptions);

  const userInfo = document.getElementsByClassName("opt-box")[0]; // 회원정보수정
  const logout = document.getElementsByClassName("opt-box")[1]; // 로그아웃

  userInfo.onclick = () => {
    window.location.href = `/user/info`;
  };

  // 로그아웃
  logout.onclick = () => {
    localStorage.removeItem("jwt");
    console.log("로그아웃");
    window.location.href = `/`;
  };

  // 게시글 작성 버튼
  const editBtn = document.querySelector(".post-button");
  editBtn.onclick = () => {
    if (loginUser !== null) {
      window.location.href = `/post/new`;
    } else {
      alert("비회원은 게시글 작성이 불가합니다. 로그인 해주세요.");
    }
  };

  let currentPage = 1; // 현재 페이지
  let totalPages = null;
  const paginationContainer = this.querySelector(".pagination");

  //현재 페이지 url의 쿼리스트링을 가져옴.(?부터)
  let queryString = window.location.search;
  // 쿼리 문자열을 분석하여 객체로 변환
  let params = new URLSearchParams(queryString);

  // 특정 매개변수의 값을 가져오기 (게시글의 페이지 번호)
  const pageNum = params.get("page");

  if (pageNum != null) {
    currentPage = pageNum;
  }

  // 게시글 목록 가져오기
  fetchPosts(currentPage);

  // 게시글 목록 가져오는 메소드
  function fetchPosts(page) {
    const url = `${API_URL}/api/post/list?page=${page}`;

    fetchWithAuth(url, "GET")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const posts = data?.data; // datat가 undefinde/null이어도 에러 발생 x. undefined 반환.
        totalPages = data?.pageInfo.totalPages;

        // 게시글 컨테이너 초기화
        const listContainer = document.querySelector(".post-list");
        listContainer.innerHTML = ""; // 기존 게시글 제거

        posts.forEach((post) => createBox(post));

        updatePagination(page, totalPages); // 현재 페이지번호, 전체 페이지 수 전달
      })
      .catch((error) => {
        console.error(error);
      });
  }

  // 페이지네이션 업데이트
  function updatePagination(current, total) {
    // 현재 페이지 그룹 계산 (1~5 => 그룹 1, 6~10 => 그룹 2)
    const currentGroup = Math.max(Math.ceil(current / 5), 1);
    const startPage = (currentGroup - 1) * 5 + 1;
    const endPage = Math.min(currentGroup * 5, total);

    paginationContainer.innerHTML = "";

    // 이전 버튼 [<]
    paginationContainer.innerHTML = `<button class="page-button prev" ${
      currentGroup === 1 ? "disabled" : ""
    }>&lt;</button>`;

    // 페이지 번호 버튼 생성 (현재 그룹만 표시)
    for (let i = startPage; i <= endPage; i++) {
      paginationContainer.innerHTML += `<button class="page-number ${
        i == current ? "active" : ""
      }">${i}</button>`;
    }

    // 다음 버튼 [>]
    paginationContainer.innerHTML += `<button class="page-button next" ${
      currentGroup === Math.ceil(total / 5) ? "disabled" : ""
    }>&gt;</button>`;

    // 페이지네이션 버튼 이벤트 추가
    paginationEvents(current, total);
  }

  // 페이지네이션 버튼 이벤트
  function paginationEvents(current, total) {
    // 이전 버튼 [<]
    const prevButton = document.querySelector(".page-button.prev");
    prevButton?.addEventListener("click", () => {
      const currentGroup = Math.ceil(current / 5);
      if (currentGroup > 1) {
        const newPage = (currentGroup - 1) * 5; // 이전 그룹의 마지막 페이지
        currentPage = newPage;
        fetchPosts(newPage);
      }
    });

    // 다음 버튼 [>]
    const nextButton = document.querySelector(".page-button.next");
    nextButton?.addEventListener("click", () => {
      // const currentGroup = Math.ceil(currentPage / 5);
      const currentGroup = Math.ceil(current / 5);
      const maxGroup = Math.ceil(total / 5);
      if (currentGroup < maxGroup) {
        const newPage = currentGroup * 5 + 1; // 다음 그룹의 첫 번째 페이지
        currentPage = newPage;
        fetchPosts(newPage);
      }
    });

    // 페이지 번호 버튼
    const pageButtons = document.querySelectorAll(".page-number");
    pageButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        const selectedPage = Number(event.target.textContent);
        if (selectedPage != current) {
          currentPage = selectedPage;
          fetchPosts(currentPage);
        }
      });
    });
  }

  // 로그인 유저 확인
  async function fetchUserInfo() {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/userinfo`, "GET");

      if (response.ok) {
        const data = await response.json();
        if (data.status === "ERROR") {
          alert(data.message);
          window.location.href = "/"; // 로그인 페이지로 리다이렉트
          return null;
        } else {
          return data; // user_id: 'n'
        }
      } else {
        alert("로그인 해주세요.");
        window.location.href = "/";
        throw new Error("로그인 해주세요.");
      }
    } catch (error) {
      console.error("Error: ", error);
      return null;
    }
  }

  // 콘텐츠 목록 div 박스 추가
  function createBox(item) {
    let newPost = document.createElement("article");
    newPost.classList.add("post-card", "rel");

    newPost.innerHTML = `
    <div class="post-image rel cursor">
      <img src="${item.imgUrl || "/public/images/photo.jpg"}" />
    </div>
    <h3 class="post-title cursor">${item.title}</h3>
    <div class="post-info">
      <div class="post-info">
        <span class="author-profile">
          <img src="${item.profileUrl || "/public/images/basic_user.png"}" />
        </span>
        <span class="post-author">${item.nickname}</span>
      </div>
      <div class="post-icon hide">
        <img class="thumbnail" src="/public/images/camera.png" />
      </div>
    </div>`;

    // 생성한 게시글을 목록에 추가
    document.querySelector(".post-list").append(newPost);

    let cameraIcon = newPost.querySelector(".post-icon");
    if (item.iris || item.shutterSpeed || item.iso) {
      cameraIcon.classList.remove("hide");
    }

    let postImg = newPost.querySelector(".post-image");
    let title = newPost.querySelector(".post-title");

    // 클릭 시 해당 게시글로 이동
    postImg.onclick = () => {
      window.location.href = `/post/${item.id}?page=${currentPage}`;
    };
    title.onclick = () => {
      window.location.href = `/post/${item.id}?page=${currentPage}`;
    };
  }

  // JWT 포함한 fetch 함수
  async function fetchWithAuth(url, method, body = null) {
    const token = localStorage.getItem("jwt"); // JWT를 localStorage에서 가져옴
    const headers = {
      "Content-Type": "application/json",
      Authorization: `${token}`, // Authorization 헤더에 JWT 추가
    };

    const options = {
      method: method,
      headers: headers,
    };

    if (body) {
      options.body = JSON.stringify(body); // 요청에 body가 필요한 경우 추가
    }

    return fetch(url, options);
  }
});
