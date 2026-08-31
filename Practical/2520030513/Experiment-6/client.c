#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>

#define FIFO_NAME "server_fifo"
#define BUFFER_SIZE 100

int main()
{
    char message[BUFFER_SIZE];

    int fd = open(FIFO_NAME, O_WRONLY);

    if (fd == -1)
    {
        perror("open");
        printf("Start the server first.\n");
        exit(EXIT_FAILURE);
    }

    printf("Enter message: ");
    fgets(message, BUFFER_SIZE, stdin);

    write(fd, message, strlen(message));

    printf("Message sent to server.\n");

    close(fd);

    return 0;
}
