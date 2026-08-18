'use client';

/* KanbanBoard - Bảng Kanban kéo thả cho pipeline dự án kính */
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ProjectCard from './ProjectCard';
import styles from './KanbanBoard.module.css';

/* Cấu hình các giai đoạn pipeline */
const STAGES = [
  { id: 'NEW', label: 'Mới', icon: '🆕' },
  { id: 'SURVEYING', label: 'Khảo sát', icon: '📐' },
  { id: 'QUOTING', label: 'Báo giá', icon: '📄' },
  { id: 'NEGOTIATING', label: 'Đàm phán', icon: '🤝' },
  { id: 'WON', label: 'Thành công ✅', icon: '' },
  { id: 'LOST', label: 'Thất bại ❌', icon: '' },
];

/* Định dạng tiền VND */
function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function KanbanBoard({ projects = [], onProjectMove }) {
  /* Nhóm project theo giai đoạn */
  const projectsByStage = STAGES.reduce((acc, stage) => {
    acc[stage.id] = projects.filter((p) => p.stage === stage.id);
    return acc;
  }, {});

  /* Xử lý khi kéo thả xong */
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    /* Không có đích đến hoặc không thay đổi */
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    /* Gọi callback cập nhật stage */
    if (onProjectMove) {
      onProjectMove(draggableId, destination.droppableId);
    }
  };

  return (
    <div className={styles.boardContainer}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className={styles.board}>
          {STAGES.map((stage) => {
            const stageProjects = projectsByStage[stage.id] || [];
            const totalValue = stageProjects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);

            return (
              <div
                key={stage.id}
                className={`${styles.column} ${styles[`stage${stage.id}`]}`}
              >
                {/* Header cột */}
                <div className={styles.columnHeader}>
                  <div className={styles.columnTitle}>
                    <span className={styles.stageName}>
                      {stage.icon} {stage.label}
                    </span>
                    <span className={styles.stageCount}>{stageProjects.length}</span>
                  </div>
                  <div className={styles.stageTotal}>
                    {formatVND(totalValue)}
                  </div>
                </div>

                {/* Vùng thả */}
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`${styles.cardList} ${
                        snapshot.isDraggingOver ? styles.draggingOver : ''
                      }`}
                    >
                      {stageProjects.length === 0 ? (
                        <div className={styles.emptyColumn}>
                          Kéo dự án vào đây
                        </div>
                      ) : (
                        stageProjects.map((project, index) => (
                          <Draggable
                            key={project.id}
                            draggableId={project.id}
                            index={index}
                          >
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                              >
                                <ProjectCard
                                  project={project}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
