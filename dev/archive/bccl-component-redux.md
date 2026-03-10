# design and storage of bccl components and css


for bccl components we have taco skeletons:

 makeCard:
    classes_used:
      - bw-card
      - bw-card-body
      - bw-card-footer
      - bw-card-hoverable
      - bw-card-primary
      - bw-card-subtitle
      - bw-card-title
      - bw-mb-2
      - bw-shadow
      - bw-text-muted
    taco_hierarchy:
      - div  .bw-card .bw-card-primary .bw-shadow .bw-card-hoverable
        - div  .bw-card-body
          - h5  .bw-card-title
            # text: "Title"
          - h6  .bw-card-subtitle .bw-mb-2 .bw-text-muted
            # text: "Subtitle"
          - "(text)"
        - div  .bw-card-footer
          # text: "Footer"
    structural_css:
      .bw-card:
        position: relative
        display: flex
        flex-direction: column
        min-width: 0
        height: 100%
        word-wrap: break-word
        background-clip: border-box
        margin-bottom: 1.5rem
        overflow: hidden
      .bw-shadow:
        box-shadow: "0 .5rem 1rem rgba(0,0,0,.15) !important"
      .bw-card-hoverable:
        transition: all 0.3s ease-out
      .bw-card-hoverable:hover:
        transform: translateY(-4px)
      .bw-card-body:
        flex: 1 1 auto
      .bw-card-body > *:last-child:
        margin-bottom: 0
      .bw-card-title:
        margin-bottom: 0.5rem
        font-size: 1.125rem
        font-weight: 600
        line-height: 1.3
      .bw-card-subtitle, .card-subtitle:
        margin-top: -0.25rem
        margin-bottom: 0.5rem
        font-size: 0.875rem
      .bw-mb-2:
        margin-bottom: .5rem !important
      .bw-card-footer:
        font-size: 0.875rem