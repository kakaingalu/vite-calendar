import Swal from 'sweetalert2';

import { useEffect } from 'react';


export function scrollRight(containerSelector: string, scrollAmount: number) {
    const container = document.querySelector(containerSelector);

    if (!container) {
        return;
    }

    const currentScrollLeft = container.scrollLeft;
    const newScrollLeft = currentScrollLeft + scrollAmount;

    container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
    });
}

export function scrollLeft(containerSelector: string, scrollAmount: number) {
    const container = document.querySelector(containerSelector);

    if (!container) {
        return;
    }

    const currentScrollLeft = container.scrollLeft;
    const newScrollLeft = currentScrollLeft - scrollAmount;

    container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
    });
}

// Function to perform error checks
export const performErrorChecks = async (response: any) => {
    if (response.status === 401) {
        Swal.fire({
            icon: 'error',
            title: 'Expired Access Token',
            text: 'Your Access Token is expired. Login to get a new access token',
            confirmButtonText: 'Okay',
        })
        return {error: true, navigate: '/login'};
    } else if (response.status === 403) {
        Swal.fire({
            icon: 'error',
            title: 'Unauthorized Access',
            text: 'You are tyring to access a forbidden resource. Login to get an access token',
            confirmButtonText: 'Okay'
        })
        return {error: true, navigate: '/login'};
    } 
    // Successful get request
    else if (response.status === 200) {
        return {error: false, data: await response.data};
    // Successful post request
    } else if (response.status === 201) {
        return {error: false, data: await response.data};
    } 
}

export const getAccessToken = () => {
    return localStorage.getItem('access_token');
};

// Helper Functions
export const formatDate = (dateString: string): string => {
  if (!dateString) return "";

  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",  // must match literal type
    day: "numeric",
    year: "numeric",
  };

  return new Date(dateString).toLocaleDateString("en-US", options);
};





// Custom hook to automatically adjust the height of a textarea based on its content
export const useAutosizeTextArea = (
  textAreaRef: HTMLTextAreaElement | null,
  value: string
) => {
  useEffect(() => {
    if (textAreaRef) {
      textAreaRef.style.height = "0px";
      const scrollHeight = textAreaRef.scrollHeight;
      textAreaRef.style.height = scrollHeight + "px";
    }
  }, [textAreaRef, value]);
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High':
      return 'red';
    case 'Medium':
      return 'orange';
    case 'Low':
      return 'green';
    default:
      return 'gray';
  }
};

export default useAutosizeTextArea;
